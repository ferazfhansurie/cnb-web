'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Last Updated: {formattedDate}</p>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="mb-3">
              This Privacy Policy describes how CNB Web ("we", "our", or "us") collects, uses, and shares your personal information when you use our website, mobile application, and services (collectively, the "Services").
            </p>
            <p>
              We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you about how we look after your personal data, your privacy rights, and how the law protects you. Please read this Privacy Policy carefully to understand our practices regarding your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Data Controller</h2>
            <p className="mb-3">
              CNB Web is the data controller and responsible for your personal data. If you have any questions about this Privacy Policy, including any requests to exercise your legal rights, please contact us using the details set out below.
            </p>
            <p className="mb-3">
              <strong>Contact Details:</strong><br />
              Email address: privacy@cnbweb.com<br />
              Postal address: [Your Company Address]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Information We Collect</h2>
            <p className="mb-3">
              We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">3.1 Personal Identifiers</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Postal address</li>
                  <li>Username or similar identifier</li>
                  <li>Password</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">3.2 Technical Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Internet protocol (IP) address</li>
                  <li>Browser type and version</li>
                  <li>Device information (type, model, operating system)</li>
                  <li>Time zone setting and location</li>
                  <li>Browser plug-in types and versions</li>
                  <li>Operating system and platform</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">3.3 Usage Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Information about how you use our Services</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on pages</li>
                  <li>Click path through the Services</li>
                  <li>Search queries</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. How We Collect Your Information</h2>
            <p className="mb-3">
              We use different methods to collect data from and about you including through:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">4.1 Direct Interactions</h3>
                <p>
                  You may give us your personal data by filling in forms, creating an account, or by corresponding with us by post, phone, email, or otherwise.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">4.2 Automated Technologies</h3>
                <p>
                  As you interact with our Services, we may automatically collect Technical Data about your equipment, browsing actions, and patterns. We collect this personal data by using cookies, server logs, and other similar technologies.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">4.3 Third Parties</h3>
                <p>
                  We may receive personal data about you from various third parties such as analytics providers, advertising networks, and search information providers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. How We Use Your Information</h2>
            <p className="mb-3">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">5.1 Provide and Manage Services</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>To register you as a new user</li>
                  <li>To provide and maintain our Services</li>
                  <li>To manage your account and relationship with us</li>
                  <li>To process and deliver your orders</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">5.2 Improve and Develop</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>To improve our Services</li>
                  <li>To develop new features, products, or services</li>
                  <li>To analyze how users interact with our Services</li>
                  <li>To test new products, features, and services</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">5.3 Communicate</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>To notify you about changes to our Services or terms</li>
                  <li>To send you service-related communications</li>
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To send you marketing communications (with your consent)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">5.4 Security and Legal Compliance</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>To protect our Services against fraud, unauthorized transactions, claims, and other liabilities</li>
                  <li>To enforce our terms and conditions</li>
                  <li>To comply with legal obligations</li>
                  <li>To resolve disputes and troubleshoot problems</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
            <p className="mb-3">
              We may share your personal data with the following categories of recipients:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">6.1 Service Providers</h3>
                <p>
                  We may share your information with third-party service providers who perform services on our behalf, such as web hosting, data analysis, payment processing, order fulfillment, customer service, and marketing assistance.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">6.2 Business Partners</h3>
                <p>
                  We may share your information with our business partners to offer you certain products, services, or promotions.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">6.3 Legal Requirements</h3>
                <p>
                  We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">6.4 Business Transfers</h3>
                <p>
                  If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Data Security</h2>
            <p className="mb-3">
              We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Encryption of sensitive data</li>
              <li>Secure user authentication</li>
              <li>Regular security assessments</li>
              <li>Access controls and authorization procedures</li>
              <li>Secure data backups</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Data Retention</h2>
            <p className="mb-3">
              We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
            </p>
            <p>
              To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data, and whether we can achieve those purposes through other means, and the applicable legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Your Legal Rights</h2>
            <p className="mb-3">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">9.1 Access</h3>
                <p>
                  You have the right to request copies of your personal data. We may charge a reasonable fee for additional copies.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">9.2 Rectification</h3>
                <p>
                  You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">9.3 Erasure</h3>
                <p>
                  You have the right to request that we erase your personal data, under certain conditions.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">9.4 Restriction</h3>
                <p>
                  You have the right to request that we restrict the processing of your personal data, under certain conditions.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">9.5 Data Portability</h3>
                <p>
                  You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">9.6 Object</h3>
                <p>
                  You have the right to object to our processing of your personal data, under certain conditions.
                </p>
              </div>
            </div>
            <p className="mt-4">
              If you wish to exercise any of these rights, please contact us using the contact details provided above. We may need to request specific information from you to help us confirm your identity and ensure your right to access your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Children's Privacy</h2>
            <p className="mb-3">
              Our Services are not intended for children under the age of 13, and we do not knowingly collect personal data from children under 13. If we learn we have collected or received personal data from a child under 13 without verification of parental consent, we will delete that information.
            </p>
            <p>
              If you are a parent or guardian and you believe your child has provided us with personal data without your consent, please contact us immediately, and we will take steps to remove that information from our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. International Transfers</h2>
            <p>
              Your information may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. If you are located outside the United States and choose to provide information to us, please note that we transfer the data to the United States and process it there. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Cookies and Tracking Technologies</h2>
            <p className="mb-3">
              We use cookies and similar tracking technologies to track activity on our Services and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="mb-3">
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Essential Cookies:</strong> Necessary for the operation of our Services.</li>
              <li><strong>Analytical/Performance Cookies:</strong> Allow us to recognize and count the number of visitors and see how visitors move around our Services.</li>
              <li><strong>Functionality Cookies:</strong> Used to recognize you when you return to our Services.</li>
              <li><strong>Targeting Cookies:</strong> Record your visit to our Services, the pages you have visited, and the links you have followed.</li>
            </ul>
            <p className="mt-3">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Third-Party Links</h2>
            <p>
              Our Services may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Changes to This Privacy Policy</h2>
            <p className="mb-3">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Contact Us</h2>
            <p className="mb-3">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>By email: privacy@cnbweb.com</li>
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
          <p className="text-sm">
            &copy; {new Date().getFullYear()} CNB Web. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 