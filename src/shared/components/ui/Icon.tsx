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
// Per-icon deep imports (resolved to real .mjs files by the custom resolver in
// metro.config.js) so Metro only bundles the icons below, not the full ~1,700-icon barrel.
// Some names moved to Lucide's new scheme (e.g. AlertCircle -> circle-alert); the local
// alias is kept stable so REGISTRY below is unchanged.
import type { LucideIcon } from "lucide-react-native";
import AlertCircle from "lucide-react-native/icons/circle-alert";
import ArrowDownRight from "lucide-react-native/icons/arrow-down-right";
import ArrowRightLeft from "lucide-react-native/icons/arrow-right-left";
import ArrowUpRight from "lucide-react-native/icons/arrow-up-right";
import Bell from "lucide-react-native/icons/bell";
import Briefcase from "lucide-react-native/icons/briefcase";
import Building2 from "lucide-react-native/icons/building-2";
import Calendar from "lucide-react-native/icons/calendar";
import CalendarClock from "lucide-react-native/icons/calendar-clock";
import Camera from "lucide-react-native/icons/camera";
import Car from "lucide-react-native/icons/car";
import Check from "lucide-react-native/icons/check";
import CheckSquare from "lucide-react-native/icons/square-check-big";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import ChevronUp from "lucide-react-native/icons/chevron-up";
import Clock from "lucide-react-native/icons/clock";
import Contact from "lucide-react-native/icons/contact";
import CreditCard from "lucide-react-native/icons/credit-card";
import DoorOpen from "lucide-react-native/icons/door-open";
import Droplet from "lucide-react-native/icons/droplet";
import Edit3 from "lucide-react-native/icons/pen-line";
import ExternalLink from "lucide-react-native/icons/external-link";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import FileText from "lucide-react-native/icons/file-text";
import Filter from "lucide-react-native/icons/funnel";
import Globe from "lucide-react-native/icons/globe";
import Hash from "lucide-react-native/icons/hash";
import Home from "lucide-react-native/icons/house";
import ImageIcon from "lucide-react-native/icons/image";
import Info from "lucide-react-native/icons/info";
import Languages from "lucide-react-native/icons/languages";
import Landmark from "lucide-react-native/icons/landmark";
import Layers from "lucide-react-native/icons/layers";
import LayoutDashboard from "lucide-react-native/icons/layout-dashboard";
import Lock from "lucide-react-native/icons/lock";
import MapPin from "lucide-react-native/icons/map-pin";
import Mail from "lucide-react-native/icons/mail";
// Lucide carries no brand marks, so WhatsApp is represented by the generic chat bubble.
import MessageCircle from "lucide-react-native/icons/message-circle";
import MessageSquare from "lucide-react-native/icons/message-square";
import MinusCircle from "lucide-react-native/icons/circle-minus";
import Moon from "lucide-react-native/icons/moon";
import MoreHorizontal from "lucide-react-native/icons/ellipsis";
import Pencil from "lucide-react-native/icons/pencil";
import Phone from "lucide-react-native/icons/phone";
import Plus from "lucide-react-native/icons/plus";
import PlusCircle from "lucide-react-native/icons/circle-plus";
import Receipt from "lucide-react-native/icons/receipt";
import Ruler from "lucide-react-native/icons/ruler";
import Search from "lucide-react-native/icons/search";
import Settings from "lucide-react-native/icons/settings";
import Shield from "lucide-react-native/icons/shield";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import Sparkles from "lucide-react-native/icons/sparkles";
import Square from "lucide-react-native/icons/square";
import Store from "lucide-react-native/icons/store";
import Sun from "lucide-react-native/icons/sun";
import Trash2 from "lucide-react-native/icons/trash-2";
import TrendingDown from "lucide-react-native/icons/trending-down";
import TrendingUp from "lucide-react-native/icons/trending-up";
import User from "lucide-react-native/icons/user";
import UserMinus from "lucide-react-native/icons/user-minus";
import UserX from "lucide-react-native/icons/user-x";
import Users from "lucide-react-native/icons/users";
import Wallet from "lucide-react-native/icons/wallet";
import WifiOff from "lucide-react-native/icons/wifi-off";
import X from "lucide-react-native/icons/x";
import Zap from "lucide-react-native/icons/zap";
import React from "react";

import type { IconSize } from "@/src/core/theme";

const REGISTRY = {
  "alert-circle": AlertCircle,
  "arrow-down-right": ArrowDownRight,
  "arrow-right-left": ArrowRightLeft,
  "arrow-up-right": ArrowUpRight,
  bank: Landmark,
  languages: Languages,
  layers: Layers,
  "layout-dashboard": LayoutDashboard,
  bell: Bell,
  briefcase: Briefcase,
  building: Building2,
  calendar: Calendar,
  "calendar-clock": CalendarClock,
  camera: Camera,
  car: Car,
  check: Check,
  "check-square": CheckSquare,
  square: Square,
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
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  "minus-circle": MinusCircle,
  moon: Moon,
  more: MoreHorizontal,
  pencil: Pencil,
  phone: Phone,
  plus: Plus,
  "plus-circle": PlusCircle,
  receipt: Receipt,
  ruler: Ruler,
  search: Search,
  settings: Settings,
  shield: Shield,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
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
  "wifi-off": WifiOff,
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
