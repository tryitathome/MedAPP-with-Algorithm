import assert from 'node:assert/strict';
import test from 'node:test';
import type { Patient } from '@shared/types';
import { PatientService } from '../services/api/patientService';
import { parsePatientFromFilePath, type PatientFolderInfo } from './folderParser';
import {
  applicationPatientId,
  ensureFolderPatients,
  replaceImportedImageFiles,
  type PatientPersistenceGateway
} from './folderPatientImport';

function file(name: string, webkitRelativePath = ''): File {
  return { name, webkitRelativePath } as File;
}

function folderPatient(images: File[]): PatientFolderInfo {
  return {
    name: '张三',
    caseNumber: '88888888',
    diagnosis: '口腔扁平苔藓',
    date: '2025-01-01',
    hasBiopsy: false,
    folderPath: '张三-88888888-口腔扁平苔藓-250101-N',
    images
  };
}

function patient(id: string): Patient {
  return {
    id,
    name: '张三',
    history: '口腔扁平苔藓',
    date: '2025-01-01',
    index: '88888888',
    biopsyConfirmed: false
  };
}

test('original folder File exposes webkitRelativePath before compression', () => {
  const original = file(
    'image.jpg',
    '张三-88888888-口腔扁平苔藓-250101-N/image.jpg'
  );

  assert.ok(original.webkitRelativePath);
  assert.equal(parsePatientFromFilePath(original)?.name, '张三');
});

test('compressed File can lack webkitRelativePath while retained patientId survives', () => {
  const id = '张三-88888888-2025-01-01';
  const original = file('image.jpg', '张三-88888888-口腔扁平苔藓-250101-N/image.jpg');
  const compressed = file('image.jpg');

  assert.equal(parsePatientFromFilePath(compressed), null);
  const retained = replaceImportedImageFiles([{ file: original, patientId: id }], [compressed]);
  assert.equal(retained[0].file, compressed);
  assert.equal(retained[0].patientId, id);
});

test('missing folder patient is created once and all images retain its application patient_id', async () => {
  const images = [file('one.jpg'), file('two.jpg')];
  const metadata = folderPatient(images);
  const id = applicationPatientId(metadata);
  let lookups = 0;
  let creates = 0;

  const gateway: PatientPersistenceGateway = {
    async getPatientById() {
      lookups += 1;
      return null;
    },
    async createPatient(request) {
      creates += 1;
      assert.equal(request.patientId, id);
      return { success: true, data: patient(id) };
    }
  };

  const imported = await ensureFolderPatients([metadata], gateway);
  assert.equal(lookups, 1);
  assert.equal(creates, 1);
  assert.deepEqual(imported[0].images.map(image => image.patientId), [id, id]);
});

test('existing patient is reused without creating another patient', async () => {
  const metadata = folderPatient([file('one.jpg')]);
  const id = applicationPatientId(metadata);
  let creates = 0;

  const gateway: PatientPersistenceGateway = {
    async getPatientById() {
      return { success: true, data: patient(id) };
    },
    async createPatient() {
      creates += 1;
      return { success: true, data: patient(id) };
    }
  };

  const imported = await ensureFolderPatients([metadata], gateway);
  assert.equal(creates, 0);
  assert.equal(imported[0].patientId, id);
});

test('duplicate metadata for one patient performs only one lookup/create operation', async () => {
  const first = folderPatient([file('one.jpg')]);
  const second = folderPatient([file('two.jpg')]);
  const id = applicationPatientId(first);
  let lookups = 0;
  let creates = 0;

  const gateway: PatientPersistenceGateway = {
    async getPatientById() {
      lookups += 1;
      return null;
    },
    async createPatient() {
      creates += 1;
      return { success: true, data: patient(id) };
    }
  };

  const imported = await ensureFolderPatients([first, second], gateway);
  assert.equal(lookups, 1);
  assert.equal(creates, 1);
  assert.deepEqual(imported.map(item => item.patientId), [id, id]);
});

test('patient lookup returns null for 404 but propagates server and network failures', async () => {
  const notFound = new PatientService(
    'http://example.test/api',
    (async () => new Response('{}', { status: 404 })) as typeof fetch
  );
  assert.equal(await notFound.getPatientById('missing'), null);

  const serverFailure = new PatientService(
    'http://example.test/api',
    (async () => new Response(JSON.stringify({ message: 'database unavailable' }), { status: 503 })) as typeof fetch
  );
  await assert.rejects(serverFailure.getPatientById('patient-1'), /database unavailable/);

  const expressErrorShape = new PatientService(
    'http://example.test/api',
    (async () => new Response(JSON.stringify({ error: 'supabase unavailable' }), { status: 503 })) as typeof fetch
  );
  await assert.rejects(expressErrorShape.getPatientById('patient-1'), /supabase unavailable/);

  const networkFailure = new PatientService(
    'http://example.test/api',
    (async () => {
      throw new Error('network unavailable');
    }) as typeof fetch
  );
  await assert.rejects(networkFailure.getPatientById('patient-1'), /network unavailable/);
});

test('patient service invokes a context-sensitive fetch with the global receiver', async () => {
  const contextSensitiveFetch = function (this: typeof globalThis) {
    assert.equal(this, globalThis);
    return Promise.resolve(new Response('{}', { status: 404 }));
  } as typeof fetch;

  const service = new PatientService('http://example.test/api', contextSensitiveFetch);
  assert.equal(await service.getPatientById('missing'), null);
});
