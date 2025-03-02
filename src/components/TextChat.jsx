import { useState, useRef, useEffect } from "react";

const TextChat = ({ externalHandleSubmit }) => {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [canEdit, setCanEdit] = useState(true);
    const messagesEndRef = useRef(null);

    const containerRef = useRef(null);

    useEffect(() => {
      if (containerRef.current) {
        // Set scrollTop to the scrollHeight to move to the bottom.
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        
        // Prevent scroll propagation
        const handleWheel = (e) => {
          e.stopPropagation();
        };
        
        // Add event listener
        containerRef.current.addEventListener('wheel', handleWheel);
        
        // Clean up
        return () => {
          containerRef.current?.removeEventListener('wheel', handleWheel);
        };
      }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Ensure scrollToBottom runs after DOM update
        setTimeout(() => {
            scrollToBottom();
        }, 0);
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCanEdit(false);
        if (!prompt.trim() || !canEdit)
        {
            setCanEdit(true);
            return;
        }

        if (externalHandleSubmit) {
            externalHandleSubmit(e);
        }

        // Add user message
        const userMessage = { type: "user", content: prompt };
        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);
        setPrompt("");

        try {
            const response = await fetch(
                "https://widget-113024725109.us-central1.run.app/Response/text",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ prompt: userMessage.content }),
                }
            );

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    { type: "ai", content: data.response },
                ]);
                setIsTyping(false);
            }, 500);
            setCanEdit(true);
            } catch (error) {
                console.error("Error fetching text response:", error);
                setMessages((prev) => [
                    ...prev,
                    { type: "ai", content: "Sorry, I couldn't process your request." },
                ]);
                setIsTyping(false);
                setCanEdit(true);
            }
        };
        
        return (
            <div className="flex flex-1 flex-col w-full overflow-hidden md:h-[240px] z-10">
          <div ref={containerRef} className="flex-1 overflow-y-auto p-2 bg-white/10 rounded-lg h-[300px] max-h-[300px] scrollbar">
            {messages.length > 0 && (
          <div className="space-y-3">
              {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-2 rounded-lg break-words ${msg.type === "user" ? "bg-black text-white rounded-tr-none" : "bg-[#f4f4f4] text-black rounded-tl-none border border-gray-200"}`}>
              {msg.content}
                </div>
            </div>
              ))}
              {isTyping && (
            <div className="flex justify-start">
                <div className="bg-[#f4f4f4] text-black p-2 rounded-lg rounded-tl-none border border-gray-200">
              <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
                </div>
            </div>
              )}
          </div>
            )}
        </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-1 flex-none mt-auto" >
          <input 
              type="text" 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              className="bg-white py-1 px-4 rounded-full shadow-sm outline-none w-full" 
              placeholder="Ask anything..."
              disabled={isTyping || !canEdit}
          />
          <button 
              type="submit" 
              className={`${isTyping || !prompt.trim() || !canEdit ? 'bg-gray-400' : 'bg-black'} shadow-sm rounded-full flex items-center justify-center h-[34px] w-[34px] z-10`} 
              disabled={isTyping || !prompt.trim() || !canEdit}
          >
              <i className="ri-arrow-up-line px-[10px] py-1 text-white"></i>
          </button>
            </form>
        </div>
          );
};

export default TextChat;