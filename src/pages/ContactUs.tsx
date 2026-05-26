import React from "react";

interface Props {
  isLightMode?: boolean; 
}

const ContactUs: React.FC<Props> = ({ isLightMode }) => {
  const bgClass = isLightMode ? "bg-gray-100" : "bg-gray-900";
  const textColor = isLightMode ? "text-gray-800" : "text-gray-200"; 
  const inputBg = isLightMode ? "bg-white" : "bg-gray-800";
  const inputBorder = isLightMode ? "border-gray-200" : "border-gray-700";

  return (
    <section className={`${bgClass} rounded-lg p-8`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5"> 
          <div className="space-y-3"> 
            <h2 className="text-2xl font-bold"> 
              <span className="text-blue-600">Join</span>{" "} 
              <span className="text-white-600">Our Platform</span> 
            </h2>
            <p className={`text-base ${textColor}`}>
              You can be one of the{" "}
              <span className="text-fuchsia-600">members</span>{" "}
              of our platform by just sending some necessarily information.
            </p>
            <p className={`text-sm ${textColor}`}>
              If you have any questions or suggestions, feel free to contact us. 
              We'd love to hear from you!
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-2"> 
            <div className="flex items-center space-x-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className={`text-sm ${textColor}`}>contact@echo-panda.itedev.online</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className={`text-sm ${textColor}`}>+855 0000000000</span>
            </div>
          </div>
        </div>

        <div className={`${isLightMode ? 'bg-white' : 'bg-black/50'} p-6 rounded-lg backdrop-blur-sm`}>
          <form className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                className={`w-full px-4 py-2.5 text-sm ${inputBg} border ${inputBorder} rounded-lg 
                  focus:outline-none focus:border-blue-600 ${textColor}`}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email Address"
                className={`w-full px-4 py-2.5 text-sm ${inputBg} border ${inputBorder} rounded-lg 
                  focus:outline-none focus:border-blue-600 ${textColor}`}
              />
            </div>
            <div>
              <textarea
                placeholder="Your Message"
                rows={4}
                className={`w-full px-4 py-2.5 text-sm ${inputBg} border ${inputBorder} rounded-lg 
                  focus:outline-none focus:border-blue-600 ${textColor} resize-none`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg 
                transition duration-200 font-medium"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;