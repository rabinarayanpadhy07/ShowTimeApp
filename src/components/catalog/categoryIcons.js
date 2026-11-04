import { Baby, CalendarDays, Drama, Laugh, Music, Palette, Tent, Trophy } from 'lucide-react'

const ICONS = { Music, Laugh, Drama, Trophy, Palette, Tent, Baby }

export const ICON_BY_CATEGORY = {
  CONCERT: Music,
  COMEDY: Laugh,
  THEATRE: Drama,
  SPORTS: Trophy,
  WORKSHOP: Palette,
  FESTIVAL: Tent,
  KIDS: Baby,
}

export function iconByName(name) {
  return ICONS[name] ?? CalendarDays
}

export function iconForCategory(category) {
  return ICON_BY_CATEGORY[category] ?? CalendarDays
}
