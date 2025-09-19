// src/components/Footer.tsx
'use client'
import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail, Globe } from 'lucide-react';
import { useColors } from '@/config/colors';

const Footer: React.FC = () => {
  const colors = useColors();
  
  const socialLinks = [
    {
      href: "https://github.com",
      icon: <Github className="w-5 h-5" />,
      label: "GitHub",
    },
    {
      href: "https://twitter.com",
      icon: <Twitter className="w-5 h-5" />,
      label: "Twitter",
    },
    {
      href: "mailto:contact@example.com",
      icon: <Mail className="w-5 h-5" />,
      label: "Email",
    },
    {
      href: "https://example.com",
      icon: <Globe className="w-5 h-5" />,
      label: "Website",
    }
  ];

  const footerLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/support", label: "Support" },
    { href: "/docs", label: "Documentation" },
  ];

  return (
    <footer className={`${colors.bgSecondary} relative`}>
      <div className={`${colors.glassOverlay} border-t ${colors.glassBorder}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg">
                </div>
                <span className={`text-lg font-bold ${colors.textPrimary}`}>Placeholder Name</span>
              </div>
              <p className={`${colors.textSecondary} text-sm leading-relaxed max-w-md`}>
                Building the future of artificial intelligence with cutting-edge technology 
                and innovative solutions for a better tomorrow.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {footerLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`${colors.textSecondary} ${colors.linkHover} transition-colors duration-300 text-sm hover:translate-x-1 transform`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Social Links */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>Connect With Us</h3>
              <div className="flex gap-4">
                {socialLinks.map((link) => (
                  <a 
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg ${colors.buttonGhost} border ${colors.glassBorder} ${colors.textSecondary} ${colors.linkHover} transition-all duration-300 hover:scale-110 transform`}
                    title={link.label}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className={`mt-12 pt-8 border-t ${colors.glassBorder}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className={`text-sm ${colors.textSecondary}`}>
                © 2025 Placeholder Name. All rights reserved. Building the future of AI.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className={`${colors.textSecondary}`}>Made with</span>
                <span className="text-red-500">♥</span>
                <span className={`${colors.textSecondary}`}>for the future</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;