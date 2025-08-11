import type { Metadata } from "next";

import LogoutButton from "@/components/logout-button";

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
        <div className="me-10">
          <LogoutButton />
        </div>
      </div>

      <div className="flex p-8 gap-16 w-full">
        {/* Main content area */}
        <div className="bg-teal-800 p-8 grow text-white relative rounded-xl shadow-lg overflow-x-hidden"> {/* Reduced padding to p-8, added rounded corners and shadow */}

          <div className="mt-8 text-lg gap-4 overflow-y-auto"> {/* Added relative, overflow-y-auto and max-h for potential long content */}
          <h1 className="text-4xl text-white font-bold text-center mb-8">Welcome to the Admin Dashboard</h1> {/* Added mb-8 for spacing */}
            <p className="mb-4">"Jason" is a classic name with Greek and Hebrew origins, meaning "healer". <br />
              It's also a prominent figure in Greek mythology, known as the leader of the Argonauts on their quest for the Golden Fleece. <br />
              Here's a more detailed look at the name and its namesake:
            </p>

            <p className="mt-4 font-semibold"><strong> Meaning and Origin:</strong></p>

            <ul className="list-disc list-inside mb-4 ml-4"> {/* Added ml-4 for better list indentation */}
              <li>
                Greek: The name Jason originates from the Greek word "iaomai," meaning "to heal".
              </li>
              <li>
                Hebrew: It also has roots in Hebrew, where it can be interpreted as "the Lord is salvation".
              </li>
            </ul>

            <p className="mt-4 font-semibold"><strong>Jason in Greek Mythology:</strong></p>

            <p className="mb-4">
              Jason was a hero renowned for leading the Argonauts in their quest for the Golden Fleece.
              He was the son of Aeson, the rightful king of Iolcos, who was usurped by his half-brother Pelias.
              To reclaim his throne, Pelias sent Jason on a perilous journey to retrieve the Golden Fleece.
            </p>
            <p>
              Jason's quest involved battling monsters, navigating treacherous waters, and ultimately securing the Fleece with the help of the sorceress Medea.
              Their story is a popular subject in Greek literature and has been adapted into various films.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
