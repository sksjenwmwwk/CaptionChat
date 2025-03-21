import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageResponse } from "@shared/schema";

// Initialize the Google Generative AI with API key
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
};

export async function generateCaptions(keyword: string): Promise<MessageResponse> {
  try {
    const model = getGeminiModel();
    
    const prompt = `
      Generate UNIQUE and CREATIVE social media content specifically tailored for this keyword: "${keyword}"
      
      Please provide:
      1. Three ORIGINAL, engaging, and trending captions for social media posts (Instagram, TikTok, etc.)
         - Each caption should be different in style and tone
         - Include emojis where appropriate
         - Make them catchy, emotional, and shareable
         - AVOID generic phrases that could apply to any keyword
      
      2. Ten relevant hashtags that would help the post reach a wider audience
         - Include a mix of popular trending tags and niche specific tags
         - Make sure at least 5 hashtags are specifically related to "${keyword}"
         - Format all hashtags with the # symbol
      
      Format your response as JSON with the following structure:
      {
        "captions": ["caption1", "caption2", "caption3"],
        "hashtags": ["#hashtag1", "#hashtag2", ... "#hashtag10"]
      }
      
      IMPORTANT: Be extremely specific to the keyword "${keyword}" - your response should be obviously different from responses for other keywords.
      Return ONLY the JSON without any other text.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Find the JSON part in case there's surrounding text
      const jsonMatch = text.match(/\{(.|\n|\r)*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      
      const parsed = JSON.parse(jsonString);
      
      // Ensure the response has the expected structure
      if (!parsed.captions || !Array.isArray(parsed.captions) || 
          !parsed.hashtags || !Array.isArray(parsed.hashtags)) {
        throw new Error("Invalid response structure");
      }
      
      // Format hashtags to ensure they have the # prefix
      const formattedHashtags = parsed.hashtags.map((tag: string) => 
        tag.startsWith("#") ? tag : `#${tag}`
      );
      
      return {
        captions: parsed.captions,
        hashtags: formattedHashtags
      };
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      
      // Fallback response with simple parsing
      const captionsMatch = text.match(/captions"?\s*:\s*\[((.|\n|\r)*?)\]/);
      const hashtagsMatch = text.match(/hashtags"?\s*:\s*\[((.|\n|\r)*?)\]/);
      
      const captions = captionsMatch 
        ? captionsMatch[1].split(',').map((c: string) => 
            c.trim().replace(/^["']|["']$/g, '')
          ).filter(Boolean).slice(0, 3) 
        : ["Beautiful day!", "Living my best life", "Memories to cherish"];
        
      const hashtags = hashtagsMatch
        ? hashtagsMatch[1].split(',').map((h: string) => {
            const cleaned = h.trim().replace(/^["']|["']$/g, '');
            return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
          }).filter(Boolean).slice(0, 10)
        : ["#trending", "#viral", "#socialmedia", "#content", "#creator", 
           "#inspiration", "#photography", "#lifestyle", "#explore", "#follow"];
      
      return { captions, hashtags };
    }
  } catch (error) {
    console.error("Error generating captions with Gemini:", error);
    
    // Return fallback content in case of API error
    const keywordNoSpaces = keyword.replace(/\s+/g, '');
    const keywordCapitalized = keyword.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return {
      captions: [
        `✨ Capturing moments with ${keyword} that last a lifetime! The perfect way to start my day. #${keywordNoSpaces}Vibes`,
        `That ${keyword} feeling you can't describe! 💫 Sometimes the simplest things bring the greatest joy.`,
        `Living for these ${keyword} moments! 🙌 What's your favorite way to enjoy ${keywordCapitalized}?`
      ],
      hashtags: [
        `#${keywordNoSpaces}`,
        `#${keywordNoSpaces}Love`,
        `#${keywordNoSpaces}Vibes`,
        `#${keywordNoSpaces}Life`,
        `#${keywordNoSpaces}Photography`,
        "#InstaMood",
        "#Trending",
        "#PhotoOfTheDay",
        "#GoodVibes",
        "#ContentCreator"
      ]
    };
  }
}
