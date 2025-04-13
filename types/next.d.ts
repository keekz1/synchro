import { CollabPageProps } from "@/app/(protected)/collab/page";

declare module "next" {
  interface PageProps {
    fallbackData?: CollabPageProps["fallbackData"];
  }
}