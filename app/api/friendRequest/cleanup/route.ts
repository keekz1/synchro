 import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({
  senderId: z.string(),
  receiverId: z.string()
});

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { senderId, receiverId } = schema.parse(body);

     await prisma.friendRequest.deleteMany({
      where: {
        senderId,
        receiverId,
        status: "PENDING"
      }
    });

     await prisma.rejectedRequest.deleteMany({
      where: {
        senderId,
        receiverId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}