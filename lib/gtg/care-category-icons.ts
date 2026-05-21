import {
  Baby,
  BookOpen,
  BriefcaseMedical,
  CarFront,
  Dog,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  NotebookPen,
  Sparkles,
  Stethoscope,
  Trees,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CareCategoryIconName } from "@/lib/gtg/care-categories";

const iconMap: Record<CareCategoryIconName, LucideIcon> = {
  baby: Baby,
  house: House,
  users: Users,
  heartPulse: HeartPulse,
  gamepad2: Gamepad2,
  sparkles: Sparkles,
  graduationCap: GraduationCap,
  notebookPen: NotebookPen,
  bookOpen: BookOpen,
  stethoscope: Stethoscope,
  dog: Dog,
  trees: Trees,
  carFront: CarFront,
  userRound: UserRound,
  briefcaseMedical: BriefcaseMedical,
};

export function getCareCategoryIcon(iconName?: CareCategoryIconName): LucideIcon {
  return iconName ? iconMap[iconName] : Sparkles;
}
