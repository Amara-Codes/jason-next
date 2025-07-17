import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jason - Admin",
  description: "Admin dashboard for managing products and categories",
};

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <div className="w-full flex justify-between items-center mt-4">
        <div className="gapper">
        </div>
        <div className="font-chase text-8xl">Jason</div>
        <div className="bg-purple-200">
          actions
        </div>
      </div>

      <div className="flex p-8 gap-16 w-full">
        <div className="bg-red-500 basis-sm"></div>
        <div className="bg-blue-400 p-32 grow"></div>
      </div>
    </div>
  );
}
