import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { messageRequestSchema } from "@shared/schema";
import { generateCaptions } from "./gemini";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for generating captions
  app.post("/api/generate-caption", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = messageRequestSchema.parse(req.body);
      
      // Generate captions using Gemini API
      const result = await generateCaptions(validatedData.keyword);
      
      // Return the generated captions
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error generating captions:", error);
      res.status(500).json({ message: "Failed to generate captions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
