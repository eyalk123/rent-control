/**
 * Single icon surface for the app. Wraps Lucide with enforced 2px stroke,
 * rounded caps/joins, and a fixed size scale (see `core/theme/icons.ts`).
 *
 * Usage:
 *   <Icon name="plus" size={ICON_MD} color={colors.primary} />
 *
 * Add new names by importing the matching Lucide component below — names
 * are intentionally a closed union so callers can't drift to ad-hoc icons.
 */
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Camera,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Contact,
  CreditCard,
  DoorOpen,
  Droplet,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  Hash,
  Home,
  Image as ImageIcon,
  Info,
  Languages,
  Landmark,
  Lock,
  type LucideIcon,
  MapPin,
  Mail,
  MessageSquare,
  MinusCircle,
  Moon,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  PlusCircle,
  Ruler,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Store,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserMinus,
  UserX,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";
import React from "react";

import type { IconSize } from "@/src/core/theme";

const REGISTRY = {
  "alert-circle": AlertCircle,
  "arrow-down-right": ArrowDownRight,
  "arrow-right-left": ArrowRightLeft,
  "arrow-up-right": ArrowUpRight,
  bank: Landmark,
  languages: Languages,
  bell: Bell,
  briefcase: Briefcase,
  building: Building2,
  calendar: Calendar,
  "calendar-clock": CalendarClock,
  camera: Camera,
  car: Car,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  clock: Clock,
  contact: Contact,
  "credit-card": CreditCard,
  "door-open": DoorOpen,
  droplet: Droplet,
  edit: Edit3,
  "external-link": ExternalLink,
  eye: Eye,
  "eye-off": EyeOff,
  "file-text": FileText,
  filter: Filter,
  globe: Globe,
  hash: Hash,
  home: Home,
  image: ImageIcon,
  info: Info,
  lock: Lock,
  mail: Mail,
  "map-pin": MapPin,
  "message-square": MessageSquare,
  "minus-circle": MinusCircle,
  moon: Moon,
  more: MoreHorizontal,
  pencil: Pencil,
  phone: Phone,
  plus: Plus,
  "plus-circle": PlusCircle,
  ruler: Ruler,
  search: Search,
  settings: Settings,
  shield: Shield,
  "shield-check": ShieldCheck,
  store: Store,
  sun: Sun,
  trash: Trash2,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  user: User,
  "user-minus": UserMinus,
  "user-x": UserX,
  users: Users,
  wallet: Wallet,
  x: X,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof REGISTRY;

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color, strokeWidth = 2 }: IconProps) {
  const Component = REGISTRY[name];
  if (!Component) {
    if (__DEV__) {
      console.warn(`<Icon> unknown name: ${name}`);
    }
    return null;
  }
  return (
    <Component
      size={size}
      color={color ?? "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
