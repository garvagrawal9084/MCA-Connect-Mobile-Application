import { Redirect, Href } from "expo-router";

export default function Index() {
  return <Redirect href={"/login" as Href} />;
}
