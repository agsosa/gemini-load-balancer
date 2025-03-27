import { NextRequest, NextResponse } from "next/server";
import { ApiKey } from "@/lib/models/ApiKey";
import keyManager from "@/lib/services/keyManager";
import { logError } from "@/lib/services/logger";

// GET /api/admin/keys - Get all API keys
export async function GET() {
  try {
    const keys = await ApiKey.findAll({});

    // Mask the actual key values for security
    const maskedKeys = keys.map((key) => {
      const maskedKey = {
        ...key,
        key: `${key.key.substring(0, 10)}...${key.key.substring(
          key.key.length - 4
        )}`,
      };
      return maskedKey;
    });

    return NextResponse.json(maskedKeys);
  } catch (error: any) {
    logError(error, { context: "GET /api/admin/keys" });
    return NextResponse.json(
      { error: error.message || "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST /api/admin/keys - Add a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const newKey = await keyManager.addKey(key);

    // Mask the key for the response
    const maskedKey = {
      ...newKey,
      key: `${newKey.key.substring(0, 10)}...${newKey.key.substring(
        newKey.key.length - 4
      )}`,
    };

    return NextResponse.json({
      message: "API key added successfully",
      key: maskedKey,
    });
  } catch (error: any) {
    logError(error, { context: "POST /api/admin/keys" });
    return NextResponse.json(
      { error: error.message || "Failed to add API key" },
      { status: 500 }
    );
  }
}
