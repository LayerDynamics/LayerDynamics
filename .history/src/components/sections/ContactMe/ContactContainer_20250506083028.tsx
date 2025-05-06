import { FC } from 'react';
import ContactForm from './ContactForm';
import { Separator } from '@/components/ui/separator';
import { FaEnvelope, FaLinkedin, FaGithub } from 'react-icons/fa';

const ContactContainer: FC = () => {
  const socialLinks = [
    {
      name: 'Email',
      icon: <FaEnvelope className="h-5 w-5" />,
      href: 'mailto:layerdynamics@proton.me',
      label: 'layerdynamics@proton.me',
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedin className="h-5 w-5" />,
      href: 'https://linkedin.com/in/yourusername',
      label: 'Connect on LinkedIn',
    },
    {
      name: 'GitHub',
      icon: <FaGithub className="h-5 w-5" />,
      href: 'https://github.com/yourusername',
      label: 'View GitHub Profile',
    },
  ];

  return (
    <section id="contact" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-white">
            Get in Touch
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Have a project in mind or want to discuss potential opportunities? 
            Feel free to reach out through the form below or via any of my social channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Contact Information Side */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Contact Information
              </h3>
              <Separator className="my-4" />
              <div className="space-y-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      {link.icon}
                    </div>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Working Hours
              </h3>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Monday - Friday:</span> 9:00 AM - 6:00 PM
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Weekends:</span> By appointment
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Based in [Your Location], but available for remote collaboration worldwide.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactContainer;