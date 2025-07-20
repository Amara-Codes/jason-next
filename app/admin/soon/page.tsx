import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Jason - Admin",
  description: "Admin dashboard for managing products and categories",
};

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full">
        {/* Main content area */}
        <div className="bg-stone-800  grow text-white relative  overflow-x-hidden"> {/* Reduced padding to p-8, added rounded corners and shadow */}

          {/* Text content div - Removed 'absolute' and 'z-20' */}
          <div className="mt-8 text-lg gap-4 relative z-20 overflow-y-auto h-screen"> {/* Added relative, overflow-y-auto and max-h for potential long content */}
          <h1 className="text-4xl text-white font-bold text-center mb-8">Jason is working for you. Trust the process</h1> {/* Added mb-8 for spacing */}
          </div>
          {/* Image div - remains absolutely positioned behind the text */}
          <div className="absolute left-0 -right-full top-0 bottom-0 z-10 rounded-xl overflow-hidden"> {/* Added rounded-xl and overflow-hidden to match parent */}
            <Image src="/assets/img/bg.png" alt="Description of image" layout="fill" objectFit="contain" className="opacity-70" /> {/* Added opacity */}
          </div>
        </div>
      </div>
    </div>
  );
}
