"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function StoryGenerator() {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [choicesCount, setChoicesCount] = useState(0);
  const [fullStory, setFullStory] = useState("");

  const generateStory = async (newPrompt = prompt) => {
    if (!newPrompt || cooldown) return;

    setLoading(true);
    setStory("");
    setChoices([]);

    try {
      const response = await axios.post("https://ai-story-generator-backend-vjn7.onrender.com/generate-story", { prompt: newPrompt });
      const newStoryPart = response.data.story;
      setStory(newStoryPart);
      setChoices(response.data.choices);

      if (choicesCount === 0) {
        setFullStory(`${newStoryPart}`);
      }

      setCooldown(true);
      setCooldownTime(50);
      alert("Please wait for 50 seconds before making another choice. In the meantime, enjoy your story!");
    } catch (error) {
      console.error("Error generating story:", error);
      setStory("Failed to generate story. Please try again.");
    }

    setLoading(false);
  };

  const handleChoice = async (choice) => {
    if (cooldown) {
      alert("You need to wait for 50 seconds before making another choice.");
      return;
    }

    const updatedChoicesCount = choicesCount + 1;
    setChoicesCount(updatedChoicesCount);

    setFullStory((prevFullStory) => `${prevFullStory}\n\n${choice}`);

    if (updatedChoicesCount === 3) {
      setStory(fullStory + `\n\n${choice}`);
      setChoices([]);
    } else {
      generateStory(choice);
    }
  };

  useEffect(() => {
    if (cooldown && cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (cooldownTime === 0) {
      setCooldown(false);
    }
  }, [cooldown, cooldownTime]);

  const downloadStory = () => {
    const blob = new Blob([fullStory], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "generated_story.txt";
    link.click();
  };

  const generateNewStory = () => {
    setPrompt("");
    setStory("");
    setChoices([]);
    setFullStory("");
    setChoicesCount(0);
    setCooldown(false);
    setCooldownTime(0);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4">AI Story Generator</h2>

      {!story ? (
        <>
          <textarea
            className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300"
            rows="3"
            placeholder="Enter a story prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            className={`w-full mt-3 py-2 rounded-md font-bold ${cooldown ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
            onClick={() => generateStory()}
            disabled={loading || cooldown}
          >
            {loading ? "Generating..." : cooldown ? `Wait ${cooldownTime}s` : "Generate Story"}
          </button>
        </>
      ) : (
        <>
          {choicesCount !== 3 ? (
            <>
              <div className="mt-4 p-4 border-l-4 border-blue-500 bg-gray-100 rounded-md">
                <h3 className="font-bold">Generated Story:</h3>
                <ReactMarkdown>{fullStory}</ReactMarkdown>
              </div>

              {choices.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">
                    What happens next? Choices left: {3 - choicesCount}
                  </h3>
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      className={`block w-full mt-2 py-2 rounded-md font-bold ${cooldown ? "bg-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                      onClick={() => handleChoice(choice)}
                      disabled={cooldown}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4">
              <h3 className="font-bold mb-2">The full story:</h3>
              <ReactMarkdown>{fullStory}</ReactMarkdown>

              <button
                className="w-full mt-4 py-2 rounded-md font-bold bg-green-500 hover:bg-green-600 text-white"
                onClick={downloadStory}
              >
                Download Full Story
              </button>

              <button
                className="w-full mt-4 py-2 rounded-md font-bold bg-blue-500 hover:bg-blue-600 text-white"
                onClick={generateNewStory}
              >
                Generate New Story
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
