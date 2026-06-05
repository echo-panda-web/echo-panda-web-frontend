import React from "react";

interface Props {
  isLightMode?: boolean;
}

const ContactUs: React.FC<Props> = ({ isLightMode }) => {
  const bgClass = isLightMode ? "bg-zinc-100" : "bg-zinc-950";
  const borderClass = isLightMode ? "border-zinc-200" : "border-white/[0.05]";
  const textColor = isLightMode ? "text-zinc-800" : "text-zinc-100";
  const inputBg = isLightMode ? "bg-white" : "bg-white/[0.03]";
  const inputBorder = isLightMode ? "border-zinc-200" : "border-white/10";

  return (
    <section className={`${bgClass} rounded-[2rem] p-8 border ${borderClass} transition-colors duration-300`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">
              <span className="text-blue-600">Join</span>{" "}
              <span className={isLightMode ? "text-zinc-900" : "text-white"}>Our Platform</span>
            </h2>
            <p className={`text-base ${textColor}`}>
              You can be one of the{" "}
              <span className="text-blue-500 font-bold">members</span>{" "}
              of our platform by just sending some necessarily information.
            </p>
            <p className={`text-sm ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              If you have any questions or suggestions, feel free to contact us.
              We'd love to hear from you!
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLightMode ? "bg-zinc-200 text-zinc-700" : "bg-white/5 text-zinc-300"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${textColor}`}>contact@echo-panda.itedev.online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLightMode ? "bg-zinc-200 text-zinc-700" : "bg-white/5 text-zinc-300"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${textColor}`}>+855 0000000000</span>
            </div>
          </div>
        </div>

        <div className={`${isLightMode ? 'bg-white shadow-sm' : 'bg-white/5'} p-6 rounded-2xl border ${borderClass} backdrop-blur-sm`}>
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