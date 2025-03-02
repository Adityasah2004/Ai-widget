import React, { useState, useRef } from "react";

const ClothesTryOn = ({
  uploadedImage,
  fileInputRef,
  handleFileChange,
  setUploadedImage,
  setGarment,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [garmentImage, setGarmentImage] = useState(null);
  const garmentInputRef = useRef(null);

  const handleGarmentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGarmentImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleTryOn = async () => {
    setIsLoading(true);
    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Convert base64 data URLs to Blobs
      const personBlob = await fetch(uploadedImage).then(res => res.blob());
      const clothBlob = await fetch(garmentImage).then(res => res.blob());
      
      formData.append('person_image', personBlob);
      formData.append('cloth_image', clothBlob);
      
      const response = await fetch('https://widget-113024725109.us-central1.run.app/Response/image_generate', {
        method: 'POST',
        // No Content-Type header needed for FormData
        body: formData
      });

      const data = await response.json();
      setResultImage(`data:image/jpeg;base64,${data.image}`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center sm:mt-10 mt-8 justify-between flex-1 gap-2 w-full">
      {isLoading ? (
        <div className="flex items-center justify-center text-white gap-2 overflow-hidden w-full rounded-[20px] h-[210px] duration-500 transition-all">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="w-4 h-4 bg-gray-300 animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : resultImage ? (
        <div className="flex items-center justify-center text-white gap-2 overflow-hidden w-full rounded-[20px] h-[210px] duration-500 transition-all">
          <img
            src={resultImage}
            alt="Try On Result"
            loading="lazy"
            className="w-full object-cover h-[250px] duration-500 transition-all"
          />
        </div>
      ) : garmentImage ? (
        <div className="flex items-center justify-center text-white gap-2 overflow-hidden w-full rounded-[20px] h-[210px] duration-500 transition-all">
          <img
            src={garmentImage}
            alt="Selected Garment"
            loading="lazy"
            className="w-full object-cover h-[250px] duration-500 transition-all"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center text-white gap-2 overflow-hidden w-full rounded-[20px] h-[210px] duration-500 transition-all">
          <img
            src={uploadedImage || "/image.png"}
            alt="Uploaded Product"
            loading="lazy"
            className="w-full object-cover h-[250px] duration-500 transition-all"
          />
        </div>
      )}
      <button
        className="rounded-full w-full flex items-center justify-center gap-1 bg-black text-white p-1"
        onClick={() => {
          if (uploadedImage && garmentImage) {
            handleTryOn();
          } else if (uploadedImage) {
            garmentInputRef.current.click();
          } else {
            fileInputRef.current.click();
          }
        }}
        disabled={isLoading}
      >
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <input type="file" ref={garmentInputRef} className="hidden" onChange={handleGarmentChange} />
        {!uploadedImage && (
          <>
            <i className="ri-upload-cloud-2-line"></i> Upload your image
          </>
        )}
        {uploadedImage && !garmentImage && (
          <>
            <i className="ri-t-shirt-line"></i> Upload garment
          </>
        )}
        {uploadedImage && garmentImage && (isLoading ? "Processing..." : "Try on")}
      </button>
    </div>
  );
};

export default ClothesTryOn;
