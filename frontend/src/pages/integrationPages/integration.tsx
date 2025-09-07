import { Calendar } from "lucide-react";
import { BiLogoGmail } from "react-icons/bi";
import { FaGoogleDrive } from "react-icons/fa";

const Integrations = () => {
  const suggestions = [
    {
      title: "Google Calendar",
      author: "By Google Integrations",
      description: "Stay on top of important files by pulling highlights from Drive and sharing them in Teams for easy collaboration",
      language: "Popular",
      languageColor: "#10B981",
      url:"http://localhost:3000/api/v1/users/oauth?provider=google&integration=calendarFull",
      icon: <Calendar className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Gmail",
      author: "By Google Integrations",
      description: "Never miss a meeting—summarize upcoming events from your Calendar directly into Teams where your team communicates",
            language: "Popular",
      languageColor: "#10B981",
      url:"http://localhost:3000/api/v1/users/oauth?provider=google&integration=gmail",
      icon: <BiLogoGmail className="w-8 h-8 text-red-500" />
    },
    {
      title: "Google Drive",
      author: "By Google Integrations",
      description: "Turn lengthy documents into clear takeaways and deliver them into Teams to keep everyone aligned.",
            language: "Popular",
      languageColor: "#10B981",
        url:"http://localhost:3000/api/v1/users/oauth?provider=google&integration=drive",
      icon: <FaGoogleDrive className="w-8 h-8 text-pink-500" />
    },
   
  ];

  return (
    <div className=" text-white p-6 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">Suggested Integrations for you </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className=" border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {suggestion.author}
                </p>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {suggestion.description}
                </p>
              </div>
              <div className="ml-4 bg-white rounded-full p-2 flex-shrink-0">
                {suggestion.icon}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <a className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" href={`${suggestion.url}`}>
                Configure
              </a>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: suggestion.languageColor }}
                ></div>
                <span className="text-gray-400 text-sm">
                  {suggestion.language}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;