import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

     const formData = await request.formData();
    if (!formData) {
      return NextResponse.json({ error: "No form data received" }, { status: 400 });
    }

    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

     const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

     const fileBuffer = await file.arrayBuffer();
    const storage = getStorage(app);
    const storageRef = ref(storage, `profile_images/${session.user.id}_${file.name}`);

    await uploadBytes(storageRef, new Uint8Array(fileBuffer));

     const downloadURL = await getDownloadURL(storageRef);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: downloadURL },
    });

    return NextResponse.json({ image: downloadURL });

  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
