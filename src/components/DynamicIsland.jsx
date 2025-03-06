import { useRef, useState } from "react";
import TextChat from "./TextChat";
import AudioChat from "./AudioChat";
import VideoChat from "./VideoChat";
import ClothesTryOn from "./ClothesTryOn";

const DynamicIsland = () => {
  const [expanded, setExpanded] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);
  const [voiceVideoExpanded, setVoiceVideoExpanded] = useState(false);
  const [shopBoxExpanded, setShopBoxExpanded] = useState(false);
  const [callType, setCallType] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [garment, setGarment] = useState(null);
  const [showText,setShowText] = useState(true);
  const fileInputRef = useRef(null);
  const audioChatRef = useRef(null);
  const videoChatRef = useRef(null); // New ref for VideoChat

  window.onscroll = () => {
    if (window.scrollY > 200) {
      setExpanded(true);
    } else if (window.scrollY < 200 && !formExpanded) {
      setExpanded(false);
    }
  };

  const handleLeftBtnClick = () => {
    if (expanded) {
      setShopBoxExpanded(true);
    } else {
      setFormExpanded(true);
    }
  };

  const handleRightBtnClick = () => {
    // Default to voice mode; user can toggle to video via the buttons below.
    setCallType("voice");
    setVoiceVideoExpanded(true);
  };

  const handleDISubmit = (e) => {
    console.log("clicked on DI submit")
    e.preventDefault();
    if (showText) {
        console.log("show is true")
        setShowText(false)
    } else {
        console.log("show is false")
        return;
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      console.log(imageUrl, file);
    }
  };

  const closeAll = () => {
    setFormExpanded(false);
    setVoiceVideoExpanded(false);
    setShopBoxExpanded(false);
    setUploadedImage(null);
    setGarment(null);
    setShowText(true);
    
    // Stop audio recording if active
    if (audioChatRef.current) {
      audioChatRef.current.stopRecording();
    }
    if (videoChatRef.current) {
        videoChatRef.current.stopRecording();
      }
  };

  return (
    <aside className="fixed bottom-0 right-0 w-full overflow-hidden transition-all duration-500">
        <div className={`flex overflow-hidden ${ (voiceVideoExpanded || shopBoxExpanded) && "flex-col" } justify-between gap-2 overflow-hidden bg-[#f4f4f4] shadow-md shadow-black/10 backdrop-blur p-2 my-4 ${ formExpanded || voiceVideoExpanded || shopBoxExpanded ? "rounded-[20px]" : "sm:rounded-[50px] rounded-[20px]" } mx-auto transition-all duration-500 items-end ${ formExpanded || voiceVideoExpanded ? "sm:w-[50dvw] w-[90dvw]" : expanded ? "sm:w-[200px] w-[200px]" : "sm:w-[100px] w-[80px]" } ${shopBoxExpanded && "lg:w-[20dvw] sm:w-[50dvw] w-[90dvw]"} ${ formExpanded || voiceVideoExpanded || shopBoxExpanded ? "sm:min-h-[300px] min-h-[300px]" : "sm:min-h-[50px] min-h-[20px]" }`}>
            {
                !voiceVideoExpanded && !shopBoxExpanded && 
                <div className={`flex items-center justify-start ${ expanded ? "gap-2" : "gap-0"  } transition-all duration-500 ${ formExpanded ? "flex-1" : "overflow-hidden" }`}>
                    {
                        !formExpanded && 
                        <button className="bg-white rounded-full overflow-hidden flex items-center justify-center sm:h-[34px] sm:w-[34px] duration-500 transition-all" onClick={handleLeftBtnClick} >
                            <i className={`ri-${ expanded ? "t-shirt-2" : "chat-1"}-line duration-500 transition-all px-1 text-black`}></i>
                        </button>
                    }
                    <form onSubmit={handleDISubmit} className={`flex items-center gap-1 ${expanded ? 'sm:w-[110px] w-[110px]' : 'w-0'} transition-all duration-500  ${formExpanded ? "flex-1 hidden" : "flex-auto"}`}>
                        <input type="text" className={`${formExpanded ? "bg-white py-1 px-4 rounded-full shadow-sm" : "bg-white/0 p-0"} outline-none w-full duration-500 transition-all`} placeholder="Ask anything..." onClick={() => setFormExpanded(true)} />
                    </form>
                    
                    {formExpanded && <TextChat externalHandleSubmit={handleDISubmit} />}
                </div>
            }
            {
                !formExpanded && !voiceVideoExpanded && !shopBoxExpanded && 
                <button className="bg-white rounded-full overflow-hidden flex items-center justify-center sm:h-[34px] sm:w-[34px] z-10 duration-500 transition-all" onClick={handleRightBtnClick} >
                    <i className={`ri-${ expanded ? "voiceprint" : "bard" }-fill px-1 text-black duration-500 transition-all`} ></i>
                </button>
            }
            {
                voiceVideoExpanded && (
                <div className="flex flex-col items-center sm:mt-14 mt-8 justify-between flex-1 gap-2 w-full">
                    {callType === "video" ? <VideoChat  ref={videoChatRef}  /> : <AudioChat ref={audioChatRef} />}
                    <p className="flex items-start text-sm text-[#B0B0B0] min-h-[80px] max-h-[80px] gap-2 duration-500 transition-all w-full rounded-[20px] p-2">
                        Our Polo T-Shirts combine style and comfort, available in a wide range of colors including classic shades like white, black, navy blue.
                    </p>
                    <div className="flex items-center bg-white rounded-full gap-2 p-1 z-20 w-full duration-500 transition-all">
                        <div className="sm:h-[34px] h-[24px] rounded-full w-full duration-500 transition-all bg-black">
                            {/* Audio Visualizer */}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className={`${ callType === "video" ? "bg-[#F4F4F4]" : "" } rounded-full overflow-hidden flex items-center justify-center sm:h-[34px] sm:w-[34px] z-10 duration-500 transition-all`} onClick={() => setCallType("video")} >
                                <i className="ri-video-on-fill px-1 text-black"></i>
                            </button>
                            <button className={`${ callType === "voice" ? "bg-[#F4F4F4]" : "" } rounded-full overflow-hidden flex items-center justify-center sm:h-[34px] sm:w-[34px] z-10 duration-500 transition-all`} onClick={() => setCallType("voice")} >
                            <i className="ri-phone-fill px-1 text-black"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Virtual Try-On Section */}
            {shopBoxExpanded && (
                <ClothesTryOn
                    uploadedImage={uploadedImage}
                    garment={garment}
                    fileInputRef={fileInputRef}
                    handleFileChange={handleFileChange}
                    setUploadedImage={setUploadedImage}
                    setGarment={setGarment}
                />
            )}

            <div className={`absolute top-2 mx-auto left-0 right-0 pr-2 pl-4 w-full items-start justify-between duration-500 transition-all ${ formExpanded || voiceVideoExpanded || shopBoxExpanded ? "flex" : "hidden" }`} >
                {
                    formExpanded && (
                        <>
                            <span className="absolute">
                                <i className="ri-bard-fill px-1 text-[1.2rem]"></i>
                            </span>
                            <h2 className={` flex-col text-black text-[clamp(20px,4vw,28px)] font-medium leading-[28px,4vw,44px] duration-500 transition-all flex ${showText ? "opacity-100 mt-10" : "opacity-0 mt-0"}`} >
                                <span>Your Personal AI</span>
                                <span className="text-[#C0C0C0]">Shopping Assistant</span>
                            </h2>
                        </>
                    )
                }
                {
                    voiceVideoExpanded && (
                        <h2 className={`flex items-center gap-2 text-black text-[clamp(16px,4vw,20px)] font-medium leading-[28px,4vw,44px] duration-500 transition-all`} >
                            <span className="h-2 w-2 bg-[#00F000] rounded-full animate-pulse"></span>
                            <span className="whitespace-nowrap">AI Listening...</span>
                        </h2>
                    )
                }
                {
                    shopBoxExpanded && (
                        <h2 className={`flex items-center gap-2 text-black text-[clamp(16px,4vw,20px)] font-medium leading-[28px,4vw,44px] duration-500 transition-all`} >
                            <button onClick={() => { if (uploadedImage) { setUploadedImage(null); setGarment(null); } }} >
                                <i className={`ri-${ uploadedImage ? "arrow-left" : "t-shirt-2"}-line`}></i>
                            </button>
                            <span className="whitespace-nowrap">
                                {!uploadedImage && "Uploaded image"}
                                {uploadedImage && !garment && "Virtual Tryon"}
                                {uploadedImage && garment && "Select garment"}
                            </span>
                        </h2>
                    )
                }
                {
                    (formExpanded || voiceVideoExpanded || shopBoxExpanded) && 
                    <button className="bg-[#E9E9E9] rounded-full overflow-hidden flex items-center justify-center sm:h-[34px] sm:w-[34px] z-10 duration-500 transition-all" onClick={closeAll} >
                        <i className="ri-close-fill px-1 text-black"></i>
                    </button>
                }
            </div>
        </div>
        <div className={`bottom-0 ${ voiceVideoExpanded ? "opacity-100" : "opacity-0" } transition-all duration-500`} >
            <div className="relative h-[4px] bg-[linear-gradient(to_right,#6912BD,#E9B3DE,#F35F25,#78220B)]">
                <div className="absolute -top-[4px] left-0 w-full h-[100px] bg-[linear-gradient(to_right,#B17EDC,#F5D1EB,#F8A37A,#A63E20)] blur-lg animate-pulse"></div>
            </div>
        </div>
    </aside>
  );
};

export default DynamicIsland;