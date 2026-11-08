import i18n from "@/i18n";
import { Fab, FabIcon } from "./ui/fab";
import { Plus } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function FabMenu() {
  const router = useRouter();

  return (
    <Fab
      accessibilityLabel={i18n.t("addBook.title")}
      className="m-6"
      size="lg"
      onPress={() => router.push("/add-book")}
    >
      <FabIcon as={Plus} />
    </Fab>
  );
}
