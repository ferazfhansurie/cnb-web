'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function TermsOfService() {
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <header className={`py-4 px-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">CNB Web</h1>
          <Link 
            href="/login" 
            className={`px-4 py-2 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          >
            Login
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last Updated: {formattedDate}</p>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="mb-3">
              Welcome to CNB Web. These Terms of Service ("Terms") govern your access to and use of our website, mobile application, and services (collectively, the "Services"). Please read these Terms carefully before using our Services.
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Definitions</h2>
            <p className="mb-3">
              Throughout these Terms, the following definitions apply:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"Services"</strong> refers to our website, mobile application, and any other services provided by CNB Web.</li>
              <li><strong>"User"</strong> refers to any individual who accesses or uses our Services.</li>
              <li><strong>"Content"</strong> refers to any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on our Services.</li>
              <li><strong>"We," "us," "our,"</strong> and <strong>"CNB Web"</strong> refer to the company providing the Services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Account Registration and Security</h2>
            <p className="mb-3">
              To access certain features of our Services, you may need to create an account. When you create an account, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
            <p className="mt-3">
              We reserve the right to disable any user account if we believe you have violated these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. User Conduct</h2>
            <p className="mb-3">
              When using our Services, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others, including intellectual property rights</li>
              <li>Harass, abuse, or harm another person</li>
              <li>Interfere with or disrupt our Services</li>
              <li>Attempt to gain unauthorized access to our Services or systems</li>
              <li>Use our Services for any illegal or unauthorized purpose</li>
              <li>Transmit any viruses, malware, or other harmful code</li>
              <li>Collect or harvest user data without permission</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Intellectual Property Rights</h2>
            <p className="mb-3">
              Our Services and their contents, features, and functionality are owned by CNB Web and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-3">
              You may not copy, modify, distribute, sell, or lease any part of our Services without our prior written consent. You also may not reverse engineer or attempt to extract the source code of our software, unless applicable laws prohibit these restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. User Content</h2>
            <p className="mb-3">
              Our Services may allow you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material. You retain ownership of any intellectual property rights that you hold in that content.
            </p>
            <p className="mb-3">
              By posting content to our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with providing our Services.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to post any content, and that your content does not violate the rights of any third party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Third-Party Links and Services</h2>
            <p className="mb-3">
              Our Services may contain links to third-party websites or services that are not owned or controlled by CNB Web. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
            </p>
            <p>
              You acknowledge and agree that CNB Web shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Termination</h2>
            <p className="mb-3">
              We may terminate or suspend your access to our Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, you may simply discontinue using the Services or contact us to request account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              In no event shall CNB Web, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access to or use of or inability to access or use the Services</li>
              <li>Any conduct or content of any third party on the Services</li>
              <li>Any content obtained from the Services</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Disclaimer</h2>
            <p className="mb-3">
              Your use of the Services is at your sole risk. The Services are provided on an "AS IS" and "AS AVAILABLE" basis. The Services are provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
            </p>
            <p>
              CNB Web does not warrant that the Services will function uninterrupted, secure, or available at any particular time or location, or that any errors or defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="mb-3">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            <p>
              By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
            <p className="mb-3">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>By email: legal@cnbweb.com</li>
              <li>By phone: [Your Phone Number]</li>
              <li>By mail: [Your Mailing Address]</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          <p>Last Updated: {formattedDate}</p>
        </div>
      </main>

      <footer className={`py-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-auto`}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} CNB Web. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link 
                href="/privacy-policy" 
                className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-[#FB8A13] transition-colors`}
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-[#FB8A13] transition-colors`}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 