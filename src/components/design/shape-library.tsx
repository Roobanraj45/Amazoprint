'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import * as lucide from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ShapeLibraryProps = {
  onAddShape: (shapeType: string) => void;
  onAddImage: (src: string) => void;
  onAddSvgShape?: (src: string) => void;
  isAdmin?: boolean;
};

const USER_SHAPES_STORAGE_KEY = 'user_uploaded_shapes';

const basicShapes: { name: string; icon: React.ReactNode }[] = [
    { name: 'rectangle', icon: <lucide.Square className="w-10 h-10" /> },
    { name: 'oval', icon: <lucide.Circle className="w-10 h-10" /> },
    { name: 'triangle', icon: <lucide.Triangle className="w-10 h-10" /> },
    { name: 'line', icon: <lucide.Minus className="w-10 h-10" /> },
    { name: 'star', icon: <lucide.Star className="w-10 h-10" /> },
    { name: 'hexagon', icon: <lucide.Hexagon className="w-10 h-10" /> },
    { name: 'hexagon', icon: <lucide.Hexagon className="w-10 h-10" /> },
    { name: 'diamond', icon: <lucide.Diamond className="w-10 h-10" /> },
    { name: 'heart', icon: <lucide.Heart className="w-10 h-10" /> },
    { name: 'pentagon', icon: <lucide.Pentagon className="w-10 h-10" /> },
    { name: 'octagon', icon: <lucide.Octagon className="w-10 h-10" /> },
    { name: 'arrow-right', icon: <lucide.ArrowRight className="w-10 h-10" /> },
    { name: 'arrow-left', icon: <lucide.ArrowLeft className="w-10 h-10" /> },
    { name: 'arrow-up', icon: <lucide.ArrowUp className="w-10 h-10" /> },
    { name: 'arrow-down', icon: <lucide.ArrowDown className="w-10 h-10" /> },
];

const lucideShapes: { name: string; icon: React.ReactNode }[] = [
  { name: 'arrow-right', icon: <lucide.ArrowRight className="w-10 h-10" /> },
  { name: 'arrow-left', icon: <lucide.ArrowLeft className="w-10 h-10" /> },
  { name: 'arrow-up', icon: <lucide.ArrowUp className="w-10 h-10" /> },
  { name: 'arrow-down', icon: <lucide.ArrowDown className="w-10 h-10" /> },
  { name: 'chevron-right', icon: <lucide.ChevronRight className="w-10 h-10" /> },
  { name: 'chevron-left', icon: <lucide.ChevronLeft className="w-10 h-10" /> },
  { name: 'chevron-up', icon: <lucide.ChevronUp className="w-10 h-10" /> },
  { name: 'chevron-down', icon: <lucide.ChevronDown className="w-10 h-10" /> },
  { name: 'chevrons-right', icon: <lucide.ChevronsRight className="w-10 h-10" /> },
  { name: 'chevrons-left', icon: <lucide.ChevronsLeft className="w-10 h-10" /> },
  { name: 'chevrons-up', icon: <lucide.ChevronsUp className="w-10 h-10" /> },
  { name: 'chevrons-down', icon: <lucide.ChevronsDown className="w-10 h-10" /> },
  { name: 'heart', icon: <lucide.Heart className="w-10 h-10" /> },
  { name: 'diamond', icon: <lucide.Diamond className="w-10 h-10" /> },
  { name: 'shield', icon: <lucide.Shield className="w-10 h-10" /> },
  { name: 'sun', icon: <lucide.Sun className="w-10 h-10" /> },
  { name: 'moon', icon: <lucide.Moon className="w-10 h-10" /> },
  { name: 'cloud', icon: <lucide.Cloud className="w-10 h-10" /> },
  { name: 'zap', icon: <lucide.Zap className="w-10 h-10" /> },
  { name: 'sparkles', icon: <lucide.Sparkles className="w-10 h-10" /> },
  { name: 'flame', icon: <lucide.Flame className="w-10 h-10" /> },
  { name: 'award', icon: <lucide.Award className="w-10 h-10" /> },
  { name: 'badge', icon: <lucide.Badge className="w-10 h-10" /> },
  { name: 'bookmark', icon: <lucide.Bookmark className="w-10 h-10" /> },
  { name: 'bell', icon: <lucide.Bell className="w-10 h-10" /> },
  { name: 'camera', icon: <lucide.Camera className="w-10 h-10" /> },
  { name: 'move', icon: <lucide.Move className="w-10 h-10" /> },
  { name: 'message-circle', icon: <lucide.MessageCircle className="w-10 h-10" /> },
  { name: 'message-square', icon: <lucide.MessageSquare className="w-10 h-10" /> },
  { name: 'file', icon: <lucide.File className="w-10 h-10" /> },
  { name: 'folder', icon: <lucide.Folder className="w-10 h-10" /> },
  { name: 'gift', icon: <lucide.Gift className="w-10 h-10" /> },
  { name: 'hand', icon: <lucide.Hand className="w-10 h-10" /> },
  { name: 'thumbs-up', icon: <lucide.ThumbsUp className="w-10 h-10" /> },
  { name: 'thumbs-down', icon: <lucide.ThumbsDown className="w-10 h-10" /> },
  { name: 'smile', icon: <lucide.Smile className="w-10 h-10" /> },
  { name: 'frown', icon: <lucide.Frown className="w-10 h-10" /> },
  { name: 'flag', icon: <lucide.Flag className="w-10 h-10" /> },
  { name: 'home', icon: <lucide.Home className="w-10 h-10" /> },
  { name: 'map-pin', icon: <lucide.MapPin className="w-10 h-10" /> },
  { name: 'compass', icon: <lucide.Compass className="w-10 h-10" /> },
  { name: 'x', icon: <lucide.X className="w-10 h-10" /> },
  { name: 'infinity', icon: <lucide.Infinity className="w-10 h-10" /> },
  { name: 'key', icon: <lucide.Key className="w-10 h-10" /> },
  { name: 'lock', icon: <lucide.Lock className="w-10 h-10" /> },
  { name: 'mail', icon: <lucide.Mail className="w-10 h-10" /> },
  { name: 'phone', icon: <lucide.Phone className="w-10 h-10" /> },
  { name: 'settings', icon: <lucide.Settings className="w-10 h-10" /> },
  { name: 'tag', icon: <lucide.Tag className="w-10 h-10" /> },
  { name: 'user', icon: <lucide.User className="w-10 h-10" /> },
  { name: 'anchor', icon: <lucide.Anchor className="w-10 h-10" /> },
  { name: 'bomb', icon: <lucide.Bomb className="w-10 h-10" /> },
  { name: 'bot', icon: <lucide.Bot className="w-10 h-10" /> },
  { name: 'coffee', icon: <lucide.Coffee className="w-10 h-10" /> },
];

const extraShapes: { name: string; icon: React.ReactNode }[] = [
  { name: 'activity', icon: <lucide.Activity className="w-10 h-10" /> },
  { name: 'airplay', icon: <lucide.Airplay className="w-10 h-10" /> },
  { name: 'alarm-clock', icon: <lucide.AlarmClock className="w-10 h-10" /> },
  { name: 'aperture', icon: <lucide.Aperture className="w-10 h-10" /> },
  { name: 'archive', icon: <lucide.Archive className="w-10 h-10" /> },
  { name: 'at-sign', icon: <lucide.AtSign className="w-10 h-10" /> },
  { name: 'battery', icon: <lucide.Battery className="w-10 h-10" /> },
  { name: 'bluetooth', icon: <lucide.Bluetooth className="w-10 h-10" /> },
  { name: 'briefcase', icon: <lucide.Briefcase className="w-10 h-10" /> },
  { name: 'calendar', icon: <lucide.Calendar className="w-10 h-10" /> },
  { name: 'check-circle', icon: <lucide.CheckCircle className="w-10 h-10" /> },
  { name: 'clipboard', icon: <lucide.Clipboard className="w-10 h-10" /> },
  { name: 'cpu', icon: <lucide.Cpu className="w-10 h-10" /> },
  { name: 'database', icon: <lucide.Database className="w-10 h-10" /> },
  { name: 'download', icon: <lucide.Download className="w-10 h-10" /> },
  { name: 'edit', icon: <lucide.Edit className="w-10 h-10" /> },
  { name: 'eye', icon: <lucide.Eye className="w-10 h-10" /> },
  { name: 'feather', icon: <lucide.Feather className="w-10 h-10" /> },
  { name: 'filter', icon: <lucide.Filter className="w-10 h-10" /> },
  { name: 'globe', icon: <lucide.Globe className="w-10 h-10" /> },
  { name: 'image', icon: <lucide.Image className="w-10 h-10" /> },
  { name: 'layers', icon: <lucide.Layers className="w-10 h-10" /> },
  { name: 'layout', icon: <lucide.Layout className="w-10 h-10" /> },
  { name: 'link', icon: <lucide.Link className="w-10 h-10" /> },
  { name: 'loader', icon: <lucide.Loader className="w-10 h-10" /> },
  { name: 'mic', icon: <lucide.Mic className="w-10 h-10" /> },
  { name: 'monitor', icon: <lucide.Monitor className="w-10 h-10" /> },
  { name: 'music', icon: <lucide.Music className="w-10 h-10" /> },
  { name: 'navigation', icon: <lucide.Navigation className="w-10 h-10" /> },
  { name: 'paperclip', icon: <lucide.Paperclip className="w-10 h-10" /> },
  { name: 'pause', icon: <lucide.Pause className="w-10 h-10" /> },
  { name: 'play', icon: <lucide.Play className="w-10 h-10" /> },
  { name: 'power', icon: <lucide.Power className="w-10 h-10" /> },
  { name: 'refresh-cw', icon: <lucide.RefreshCw className="w-10 h-10" /> },
  { name: 'save', icon: <lucide.Save className="w-10 h-10" /> },
  { name: 'search', icon: <lucide.Search className="w-10 h-10" /> },
  { name: 'send', icon: <lucide.Send className="w-10 h-10" /> },
  { name: 'share', icon: <lucide.Share className="w-10 h-10" /> },
  { name: 'shopping-cart', icon: <lucide.ShoppingCart className="w-10 h-10" /> },
  { name: 'shuffle', icon: <lucide.Shuffle className="w-10 h-10" /> },
  { name: 'sliders', icon: <lucide.Sliders className="w-10 h-10" /> },
  { name: 'trash', icon: <lucide.Trash className="w-10 h-10" /> },
  { name: 'upload', icon: <lucide.Upload className="w-10 h-10" /> },
  { name: 'video', icon: <lucide.Video className="w-10 h-10" /> },
  { name: 'wifi', icon: <lucide.Wifi className="w-10 h-10" /> },
  { name: 'zoom-in', icon: <lucide.ZoomIn className="w-10 h-10" /> },
  { name: 'zoom-out', icon: <lucide.ZoomOut className="w-10 h-10" /> },
];

const geometricShapes = [
  { name: 'pentagon', icon: <div className="w-10 h-10 bg-current clip-pentagon" /> },
  { name: 'octagon', icon: <div className="w-10 h-10 bg-current clip-octagon" /> },
  { name: 'parallelogram', icon: <div className="w-10 h-10 bg-current skew-x-12" /> },
  { name: 'trapezoid', icon: <div className="w-10 h-10 bg-current clip-trapezoid" /> },
  { name: 'plus', icon: <lucide.Plus className="w-10 h-10" /> },
  { name: 'plus-circle', icon: <lucide.PlusCircle className="w-10 h-10" /> },
];

const uiShapes = [
  { name: 'grid', icon: <lucide.Grid className="w-10 h-10" /> },
  { name: 'columns', icon: <lucide.Columns className="w-10 h-10" /> },
  { name: 'sidebar', icon: <lucide.PanelLeft className="w-10 h-10" /> },
  { name: 'layout-grid', icon: <lucide.LayoutGrid className="w-10 h-10" /> },
  { name: 'layout-list', icon: <lucide.List className="w-10 h-10" /> },
  { name: 'box', icon: <lucide.Box className="w-10 h-10" /> },
];

const techShapes = [
  { name: 'terminal', icon: <lucide.Terminal className="w-10 h-10" /> },
  { name: 'code', icon: <lucide.Code className="w-10 h-10" /> },
  { name: 'bug', icon: <lucide.Bug className="w-10 h-10" /> },
  { name: 'server', icon: <lucide.Server className="w-10 h-10" /> },
  { name: 'hard-drive', icon: <lucide.HardDrive className="w-10 h-10" /> },
  { name: 'git-branch', icon: <lucide.GitBranch className="w-10 h-10" /> },
];


const businessShapes = [
  { name: 'shopping-bag', icon: <lucide.ShoppingBag className="w-10 h-10" /> },
  { name: 'credit-card', icon: <lucide.CreditCard className="w-10 h-10" /> },
  { name: 'dollar-sign', icon: <lucide.DollarSign className="w-10 h-10" /> },
  { name: 'wallet', icon: <lucide.Wallet className="w-10 h-10" /> },
  { name: 'receipt', icon: <lucide.Receipt className="w-10 h-10" /> },
];

const natureShapes = [
  { name: 'tree-pine', icon: <lucide.TreePine className="w-10 h-10" /> },
  { name: 'mountain', icon: <lucide.Mountain className="w-10 h-10" /> },
  { name: 'umbrella', icon: <lucide.Umbrella className="w-10 h-10" /> },
  { name: 'wind', icon: <lucide.Wind className="w-10 h-10" /> },
  { name: 'waves', icon: <lucide.Waves className="w-10 h-10" /> },
  { name: 'leaf', icon: <lucide.Leaf className="w-10 h-10" /> },
  { name: 'flower', icon: <lucide.Flower className="w-10 h-10" /> },
  { name: 'sprout', icon: <lucide.Sprout className="w-10 h-10" /> },
];

const arrowShapes = [
  { name: 'arrow-big-right', icon: <lucide.ArrowBigRight className="w-10 h-10" /> },
  { name: 'arrow-up-right', icon: <lucide.ArrowUpRight className="w-10 h-10" /> },
  { name: 'corner-down-right', icon: <lucide.CornerDownRight className="w-10 h-10" /> },
  { name: 'corner-up-left', icon: <lucide.CornerUpLeft className="w-10 h-10" /> },
];

const foodShapes = [
  { name: 'pizza', icon: <lucide.Pizza className="w-10 h-10" /> },
  { name: 'cake', icon: <lucide.Cake className="w-10 h-10" /> },
  { name: 'ice-cream-2', icon: <lucide.IceCream2 className="w-10 h-10" /> },
  { name: 'grape', icon: <lucide.Grape className="w-10 h-10" /> },
  { name: 'apple', icon: <lucide.Apple className="w-10 h-10" /> },
];

const scienceShapes = [
    { name: 'beaker', icon: <lucide.Beaker className="w-10 h-10" /> },
    { name: 'flask-conical', icon: <lucide.FlaskConical className="w-10 h-10" /> },
    { name: 'dna', icon: <lucide.Dna className="w-10 h-10" /> },
    { name: 'test-tube', icon: <lucide.TestTube className="w-10 h-10" /> },
    { name: 'brain-circuit', icon: <lucide.BrainCircuit className="w-10 h-10" /> },
];

const buildingShapes = [
  { name: 'building', icon: <lucide.Building className="w-10 h-10" /> },
  { name: 'church', icon: <lucide.Church className="w-10 h-10" /> },
  { name: 'factory', icon: <lucide.Factory className="w-10 h-10" /> },
  { name: 'store', icon: <lucide.Store className="w-10 h-10" /> },
  { name: 'warehouse', icon: <lucide.Warehouse className="w-10 h-10" /> },
]

const moreShapes: { name: string; icon: React.ReactNode }[] = [
    { name: 'accessibility', icon: <lucide.Accessibility className="w-10 h-10" /> },
    { name: 'activity-square', icon: <lucide.ActivitySquare className="w-10 h-10" /> },
    { name: 'air-vent', icon: <lucide.AirVent className="w-10 h-10" /> },
    { name: 'alarm-check', icon: <lucide.AlarmCheck className="w-10 h-10" /> },
    { name: 'alarm-clock-off', icon: <lucide.AlarmClockOff className="w-10 h-10" /> },
    { name: 'alarm-minus', icon: <lucide.AlarmMinus className="w-10 h-10" /> },
    { name: 'alarm-plus', icon: <lucide.AlarmPlus className="w-10 h-10" /> },
    { name: 'album', icon: <lucide.Album className="w-10 h-10" /> },
    { name: 'alert-circle', icon: <lucide.AlertCircle className="w-10 h-10" /> },
    { name: 'alert-octagon', icon: <lucide.AlertOctagon className="w-10 h-10" /> },
    { name: 'alert-triangle', icon: <lucide.AlertTriangle className="w-10 h-10" /> },
    { name: 'align-center', icon: <lucide.AlignCenter className="w-10 h-10" /> },
    { name: 'align-center-horizontal', icon: <lucide.AlignCenterHorizontal className="w-10 h-10" /> },
    { name: 'align-center-vertical', icon: <lucide.AlignCenterVertical className="w-10 h-10" /> },
    { name: 'align-end-horizontal', icon: <lucide.AlignEndHorizontal className="w-10 h-10" /> },
    { name: 'align-end-vertical', icon: <lucide.AlignEndVertical className="w-10 h-10" /> },
    { name: 'align-horizontal-distribute-center', icon: <lucide.AlignHorizontalDistributeCenter className="w-10 h-10" /> },
    { name: 'align-horizontal-distribute-end', icon: <lucide.AlignHorizontalDistributeEnd className="w-10 h-10" /> },
    { name: 'align-horizontal-distribute-start', icon: <lucide.AlignHorizontalDistributeStart className="w-10 h-10" /> },
    { name: 'align-horizontal-justify-center', icon: <lucide.AlignHorizontalJustifyCenter className="w-10 h-10" /> },
    { name: 'align-horizontal-justify-end', icon: <lucide.AlignHorizontalJustifyEnd className="w-10 h-10" /> },
    { name: 'align-horizontal-justify-start', icon: <lucide.AlignHorizontalJustifyStart className="w-10 h-10" /> },
    { name: 'align-horizontal-space-around', icon: <lucide.AlignHorizontalSpaceAround className="w-10 h-10" /> },
    { name: 'align-horizontal-space-between', icon: <lucide.AlignHorizontalSpaceBetween className="w-10 h-10" /> },
    { name: 'align-justify', icon: <lucide.AlignJustify className="w-10 h-10" /> },
    { name: 'align-left', icon: <lucide.AlignLeft className="w-10 h-10" /> },
    { name: 'align-right', icon: <lucide.AlignRight className="w-10 h-10" /> },
    { name: 'align-start-horizontal', icon: <lucide.AlignStartHorizontal className="w-10 h-10" /> },
    { name: 'align-start-vertical', icon: <lucide.AlignStartVertical className="w-10 h-10" /> },
    { name: 'align-vertical-distribute-center', icon: <lucide.AlignVerticalDistributeCenter className="w-10 h-10" /> },
    { name: 'align-vertical-distribute-end', icon: <lucide.AlignVerticalDistributeEnd className="w-10 h-10" /> },
    { name: 'align-vertical-distribute-start', icon: <lucide.AlignVerticalDistributeStart className="w-10 h-10" /> },
    { name: 'align-vertical-justify-center', icon: <lucide.AlignVerticalJustifyCenter className="w-10 h-10" /> },
    { name: 'align-vertical-justify-end', icon: <lucide.AlignVerticalJustifyEnd className="w-10 h-10" /> },
    { name: 'align-vertical-justify-start', icon: <lucide.AlignVerticalJustifyStart className="w-10 h-10" /> },
    { name: 'align-vertical-space-around', icon: <lucide.AlignVerticalSpaceAround className="w-10 h-10" /> },
    { name: 'align-vertical-space-between', icon: <lucide.AlignVerticalSpaceBetween className="w-10 h-10" /> },
    { name: 'ambulance', icon: <lucide.Ambulance className="w-10 h-10" /> },
    { name: 'ampersand', icon: <lucide.Ampersand className="w-10 h-10" /> },
    { name: 'ampersands', icon: <lucide.Ampersands className="w-10 h-10" /> },
    { name: 'annoyed', icon: <lucide.Annoyed className="w-10 h-10" /> },
    { name: 'antenna', icon: <lucide.Antenna className="w-10 h-10" /> },
    { name: 'archive-restore', icon: <lucide.ArchiveRestore className="w-10 h-10" /> },
    { name: 'archive-x', icon: <lucide.ArchiveX className="w-10 h-10" /> },
    { name: 'area-chart', icon: <lucide.AreaChart className="w-10 h-10" /> },
    { name: 'armchair', icon: <lucide.Armchair className="w-10 h-10" /> },
    { name: 'arrow-big-down-dash', icon: <lucide.ArrowBigDownDash className="w-10 h-10" /> },
    { name: 'arrow-big-left-dash', icon: <lucide.ArrowBigLeftDash className="w-10 h-10" /> },
    { name: 'arrow-big-right-dash', icon: <lucide.ArrowBigRightDash className="w-10 h-10" /> },
    { name: 'arrow-big-up-dash', icon: <lucide.ArrowBigUpDash className="w-10 h-10" /> },
    { name: 'arrow-down-0-1', icon: <lucide.ArrowDown01 className="w-10 h-10" /> },
    { name: 'arrow-down-1-0', icon: <lucide.ArrowDown10 className="w-10 h-10" /> },
    { name: 'arrow-down-a-z', icon: <lucide.ArrowDownAZ className="w-10 h-10" /> },
    { name: 'arrow-down-left-from-circle', icon: <lucide.ArrowDownLeftFromCircle className="w-10 h-10" /> },
    { name: 'arrow-down-right-from-circle', icon: <lucide.ArrowDownRightFromCircle className="w-10 h-10" /> },
    { name: 'arrow-down-up', icon: <lucide.ArrowDownUp className="w-10 h-10" /> },
    { name: 'arrow-down-wide-narrow', icon: <lucide.ArrowDownWideNarrow className="w-10 h-10" /> },
    { name: 'arrow-down-z-a', icon: <lucide.ArrowDownZA className="w-10 h-10" /> },
    { name: 'arrow-left-from-line', icon: <lucide.ArrowLeftFromLine className="w-10 h-10" /> },
    { name: 'arrow-left-right', icon: <lucide.ArrowLeftRight className="w-10 h-10" /> },
    { name: 'arrow-left-to-line', icon: <lucide.ArrowLeftToLine className="w-10 h-10" /> },
    { name: 'arrow-right-from-line', icon: <lucide.ArrowRightFromLine className="w-10 h-10" /> },
    { name: 'arrow-right-left', icon: <lucide.ArrowRightLeft className="w-10 h-10" /> },
    { name: 'arrow-right-to-line', icon: <lucide.ArrowRightToLine className="w-10 h-10" /> },
    { name: 'arrow-up-0-1', icon: <lucide.ArrowUp01 className="w-10 h-10" /> },
    { name: 'arrow-up-1-0', icon: <lucide.ArrowUp10 className="w-10 h-10" /> },
    { name: 'arrow-up-a-z', icon: <lucide.ArrowUpAZ className="w-10 h-10" /> },
    { name: 'arrow-up-down', icon: <lucide.ArrowUpDown className="w-10 h-10" /> },
    { name: 'arrow-up-from-dot', icon: <lucide.ArrowUpFromDot className="w-10 h-10" /> },
    { name: 'arrow-up-from-line', icon: <lucide.ArrowUpFromLine className="w-10 h-10" /> },
    { name: 'arrow-up-left-from-circle', icon: <lucide.ArrowUpLeftFromCircle className="w-10 h-10" /> },
    { name: 'arrow-up-right-from-circle', icon: <lucide.ArrowUpRightFromCircle className="w-10 h-10" /> },
    { name: 'arrow-up-to-line', icon: <lucide.ArrowUpToLine className="w-10 h-10" /> },
    { name: 'arrow-up-wide-narrow', icon: <lucide.ArrowUpWideNarrow className="w-10 h-10" /> },
    { name: 'arrow-up-z-a', icon: <lucide.ArrowUpZA className="w-10 h-10" /> },
    { name: 'arrows-up-from-line', icon: <lucide.ArrowsUpFromLine className="w-10 h-10" /> },
    { name: 'asterisk', icon: <lucide.Asterisk className="w-10 h-10" /> },
    { name: 'audio-lines', icon: <lucide.AudioLines className="w-10 h-10" /> },
    { name: 'audio-waveform', icon: <lucide.AudioWaveform className="w-10 h-10" /> },
    { name: 'axis-3d', icon: <lucide.Axis3d className="w-10 h-10" /> },
    { name: 'baby', icon: <lucide.Baby className="w-10 h-10" /> },
    { name: 'backpack', icon: <lucide.Backpack className="w-10 h-10" /> },
    { name: 'baggage-claim', icon: <lucide.BaggageClaim className="w-10 h-10" /> },
    { name: 'ban', icon: <lucide.Ban className="w-10 h-10" /> },
    { name: 'banana', icon: <lucide.Banana className="w-10 h-10" /> },
    { name: 'banknote', icon: <lucide.Banknote className="w-10 h-10" /> },
    { name: 'bar-chart', icon: <lucide.BarChart className="w-10 h-10" /> },
    { name: 'bar-chart-2', icon: <lucide.BarChart2 className="w-10 h-10" /> },
    { name: 'bar-chart-3', icon: <lucide.BarChart3 className="w-10 h-10" /> },
    { name: 'bar-chart-4', icon: <lucide.BarChart4 className="w-10 h-10" /> },
    { name: 'bar-chart-big', icon: <lucide.BarChartBig className="w-10 h-10" /> },
    { name: 'bar-chart-horizontal', icon: <lucide.BarChartHorizontal className="w-10 h-10" /> },
    { name: 'barcode', icon: <lucide.Barcode className="w-10 h-10" /> },
    { name: 'baseline', icon: <lucide.Baseline className="w-10 h-10" /> },
    { name: 'bath', icon: <lucide.Bath className="w-10 h-10" /> },
    { name: 'battery-charging', icon: <lucide.BatteryCharging className="w-10 h-10" /> },
    { name: 'battery-full', icon: <lucide.BatteryFull className="w-10 h-10" /> },
    { name: 'battery-low', icon: <lucide.BatteryLow className="w-10 h-10" /> },
    { name: 'battery-medium', icon: <lucide.BatteryMedium className="w-10 h-10" /> },
    { name: 'battery-warning', icon: <lucide.BatteryWarning className="w-10 h-10" /> },
    { name: 'bed', icon: <lucide.Bed className="w-10 h-10" /> },
    { name: 'bed-double', icon: <lucide.BedDouble className="w-10 h-10" /> },
    { name: 'bed-single', icon: <lucide.BedSingle className="w-10 h-10" /> },
    { name: 'beef', icon: <lucide.Beef className="w-10 h-10" /> },
    { name: 'beer', icon: <lucide.Beer className="w-10 h-10" /> },
    { name: 'bell-dot', icon: <lucide.BellDot className="w-10 h-10" /> },
    { name: 'bell-electric', icon: <lucide.BellElectric className="w-10 h-10" /> },
    { name: 'bell-minus', icon: <lucide.BellMinus className="w-10 h-10" /> },
    { name: 'bell-off', icon: <lucide.BellOff className="w-10 h-10" /> },
    { name: 'bell-plus', icon: <lucide.BellPlus className="w-10 h-10" /> },
    { name: 'bell-ring', icon: <lucide.BellRing className="w-10 h-10" /> },
    { name: 'between-horizontal-end', icon: <lucide.BetweenHorizontalEnd className="w-10 h-10" /> },
    { name: 'between-horizontal-start', icon: <lucide.BetweenHorizontalStart className="w-10 h-10" /> },
    { name: 'between-vertical-end', icon: <lucide.BetweenVerticalEnd className="w-10 h-10" /> },
    { name: 'between-vertical-start', icon: <lucide.BetweenVerticalStart className="w-10 h-10" /> },
    { name: 'bike', icon: <lucide.Bike className="w-10 h-10" /> },
    { name: 'binary', icon: <lucide.Binary className="w-10 h-10" /> },
    { name: 'biohazard', icon: <lucide.Biohazard className="w-10 h-10" /> },
    { name: 'bird', icon: <lucide.Bird className="w-10 h-10" /> },
    { name: 'bitcoin', icon: <lucide.Bitcoin className="w-10 h-10" /> },
    { name: 'blend', icon: <lucide.Blend className="w-10 h-10" /> },
    { name: 'blinds', icon: <lucide.Blinds className="w-10 h-10" /> },
    { name: 'blocks', icon: <lucide.Blocks className="w-10 h-10" /> },
    { name: 'bold', icon: <lucide.Bold className="w-10 h-10" /> },
    { name: 'book', icon: <lucide.Book className="w-10 h-10" /> },
    { name: 'book-a', icon: <lucide.BookA className="w-10 h-10" /> },
    { name: 'book-audio', icon: <lucide.BookAudio className="w-10 h-10" /> },
    { name: 'book-check', icon: <lucide.BookCheck className="w-10 h-10" /> },
    { name: 'book-copy', icon: <lucide.BookCopy className="w-10 h-10" /> },
    { name: 'book-dashed', icon: <lucide.BookDashed className="w-10 h-10" /> },
    { name: 'book-down', icon: <lucide.BookDown className="w-10 h-10" /> },
    { name: 'book-headphones', icon: <lucide.BookHeadphones className="w-10 h-10" /> },
    { name: 'book-heart', icon: <lucide.BookHeart className="w-10 h-10" /> },
    { name: 'book-image', icon: <lucide.BookImage className="w-10 h-10" /> },
    { name: 'book-key', icon: <lucide.BookKey className="w-10 h-10" /> },
    { name: 'book-lock', icon: <lucide.BookLock className="w-10 h-10" /> },
    { name: 'book-marked', icon: <lucide.BookMarked className="w-10 h-10" /> },
    { name: 'book-minus', icon: <lucide.BookMinus className="w-10 h-10" /> },
    { name: 'book-open', icon: <lucide.BookOpen className="w-10 h-10" /> },
    { name: 'book-open-check', icon: <lucide.BookOpenCheck className="w-10 h-10" /> },
    { name: 'book-open-text', icon: <lucide.BookOpenText className="w-10 h-10" /> },
    { name: 'book-plus', icon: <lucide.BookPlus className="w-10 h-10" /> },
    { name: 'book-template', icon: <lucide.BookTemplate className="w-10 h-10" /> },
    { name: 'book-text', icon: <lucide.BookText className="w-10 h-10" /> },
    { name: 'book-type', icon: <lucide.BookType className="w-10 h-10" /> },
    { name: 'book-up', icon: <lucide.BookUp className="w-10 h-10" /> },
    { name: 'book-up-2', icon: <lucide.BookUp2 className="w-10 h-10" /> },
    { name: 'book-user', icon: <lucide.BookUser className="w-10 h-10" /> },
    { name: 'book-x', icon: <lucide.BookX className="w-10 h-10" /> },
    { name: 'bookmark-check', icon: <lucide.BookmarkCheck className="w-10 h-10" /> },
    { name: 'bookmark-minus', icon: <lucide.BookmarkMinus className="w-10 h-10" /> },
    { name: 'bookmark-plus', icon: <lucide.BookmarkPlus className="w-10 h-10" /> },
    { name: 'bookmark-x', icon: <lucide.BookmarkX className="w-10 h-10" /> },
    { name: 'boom-box', icon: <lucide.BoomBox className="w-10 h-10" /> },
    { name: 'box-select', icon: <lucide.BoxSelect className="w-10 h-10" /> },
    { name: 'boxes', icon: <lucide.Boxes className="w-10 h-10" /> },
    { name: 'braces', icon: <lucide.Braces className="w-10 h-10" /> },
    { name: 'brackets', icon: <lucide.Brackets className="w-10 h-10" /> },
    { name: 'brain-cog', icon: <lucide.BrainCog className="w-10 h-10" /> },
    { name: 'brick-wall', icon: <lucide.BrickWall className="w-10 h-10" /> },
    { name: 'brush', icon: <lucide.Brush className="w-10 h-10" /> },
    { name: 'bug-off', icon: <lucide.BugOff className="w-10 h-10" /> },
    { name: 'bug-play', icon: <lucide.BugPlay className="w-10 h-10" /> },
    { name: 'building-2', icon: <lucide.Building2 className="w-10 h-10" /> },
    { name: 'bus', icon: <lucide.Bus className="w-10 h-10" /> },
    { name: 'bus-front', icon: <lucide.BusFront className="w-10 h-10" /> },
    { name: 'cable', icon: <lucide.Cable className="w-10 h-10" /> },
    { name: 'cable-car', icon: <lucide.CableCar className="w-10 h-10" /> },
    { name: 'calculator', icon: <lucide.Calculator className="w-10 h-10" /> },
    { name: 'calendar-check', icon: <lucide.CalendarCheck className="w-10 h-10" /> },
    { name: 'calendar-check-2', icon: <lucide.CalendarCheck2 className="w-10 h-10" /> },
    { name: 'calendar-clock', icon: <lucide.CalendarClock className="w-10 h-10" /> },
    { name: 'calendar-days', icon: <lucide.CalendarDays className="w-10 h-10" /> },
    { name: 'calendar-fold', icon: <lucide.CalendarFold className="w-10 h-10" /> },
    { name: 'calendar-heart', icon: <lucide.CalendarHeart className="w-10 h-10" /> },
    { name: 'calendar-minus', icon: <lucide.CalendarMinus className="w-10 h-10" /> },
    { name: 'calendar-minus-2', icon: <lucide.CalendarMinus2 className="w-10 h-10" /> },
    { name: 'calendar-off', icon: <lucide.CalendarOff className="w-10 h-10" /> },
    { name: 'calendar-plus', icon: <lucide.CalendarPlus className="w-10 h-10" /> },
    { name: 'calendar-plus-2', icon: <lucide.CalendarPlus2 className="w-10 h-10" /> },
    { name: 'calendar-range', icon: <lucide.CalendarRange className="w-10 h-10" /> },
    { name: 'calendar-search', icon: <lucide.CalendarSearch className="w-10 h-10" /> },
    { name: 'calendar-x', icon: <lucide.CalendarX className="w-10 h-10" /> },
    { name: 'calendar-x-2', icon: <lucide.CalendarX2 className="w-10 h-10" /> },
    { name: 'camera-off', icon: <lucide.CameraOff className="w-10 h-10" /> },
    { name: 'candlestick-chart', icon: <lucide.CandlestickChart className="w-10 h-10" /> },
    { name: 'candy', icon: <lucide.Candy className="w-10 h-10" /> },
    { name: 'candy-cane', icon: <lucide.CandyCane className="w-10 h-10" /> },
    { name: 'candy-off', icon: <lucide.CandyOff className="w-10 h-10" /> },
    { name: 'captions', icon: <lucide.Captions className="w-10 h-10" /> },
    { name: 'captions-off', icon: <lucide.CaptionsOff className="w-10 h-10" /> },
    { name: 'car', icon: <lucide.Car className="w-10 h-10" /> },
    { name: 'car-front', icon: <lucide.CarFront className="w-10 h-10" /> },
    { name: 'car-taxi-front', icon: <lucide.CarTaxiFront className="w-10 h-10" /> },
    { name: 'caravan', icon: <lucide.Caravan className="w-10 h-10" /> },
    { name: 'carrot', icon: <lucide.Carrot className="w-10 h-10" /> },
    { name: 'case-lower', icon: <lucide.CaseLower className="w-10 h-10" /> },
    { name: 'case-sensitive', icon: <lucide.CaseSensitive className="w-10 h-10" /> },
    { name: 'case-upper', icon: <lucide.CaseUpper className="w-10 h-10" /> },
    { name: 'cast', icon: <lucide.Cast className="w-10 h-10" /> },
    { name: 'castle', icon: <lucide.Castle className="w-10 h-10" /> },
    { name: 'cat', icon: <lucide.Cat className="w-10 h-10" /> },
    { name: 'cctv', icon: <lucide.Cctv className="w-10 h-10" /> },
    { name: 'check', icon: <lucide.Check className="w-10 h-10" /> },
    { name: 'check-check', icon: <lucide.CheckCheck className="w-10 h-10" /> },
    { name: 'check-square-2', icon: <lucide.CheckSquare2 className="w-10 h-10" /> },
    { name: 'chef-hat', icon: <lucide.ChefHat className="w-10 h-10" /> },
    { name: 'cherry', icon: <lucide.Cherry className="w-10 h-10" /> },
    { name: 'chevron-down-circle', icon: <lucide.ChevronDownCircle className="w-10 h-10" /> },
    { name: 'chevron-down-square', icon: <lucide.ChevronDownSquare className="w-10 h-10" /> },
    { name: 'chevron-first', icon: <lucide.ChevronFirst className="w-10 h-10" /> },
    { name: 'chevron-last', icon: <lucide.ChevronLast className="w-10 h-10" /> },
    { name: 'chevron-left-circle', icon: <lucide.ChevronLeftCircle className="w-10 h-10" /> },
    { name: 'chevron-left-square', icon: <lucide.ChevronLeftSquare className="w-10 h-10" /> },
    { name: 'chevron-right-circle', icon: <lucide.ChevronRightCircle className="w-10 h-10" /> },
    { name: 'chevron-right-square', icon: <lucide.ChevronRightSquare className="w-10 h-10" /> },
    { name: 'chevron-up-circle', icon: <lucide.ChevronUpCircle className="w-10 h-10" /> },
    { name: 'chevron-up-square', icon: <lucide.ChevronUpSquare className="w-10 h-10" /> },
    { name: 'chevrons-down-up', icon: <lucide.ChevronsDownUp className="w-10 h-10" /> },
    { name: 'chevrons-up-down', icon: <lucide.ChevronsUpDown className="w-10 h-10" /> },
    { name: 'chrome', icon: <lucide.Chrome className="w-10 h-10" /> },
    { name: 'cigarette', icon: <lucide.Cigarette className="w-10 h-10" /> },
    { name: 'cigarette-off', icon: <lucide.CigaretteOff className="w-10 h-10" /> },
    { name: 'circle-dashed', icon: <lucide.CircleDashed className="w-10 h-10" /> },
    { name: 'circle-dot', icon: <lucide.CircleDot className="w-10 h-10" /> },
    { name: 'circle-dot-dashed', icon: <lucide.CircleDotDashed className="w-10 h-10" /> },
    { name: 'circle-ellipsis', icon: <lucide.CircleEllipsis className="w-10 h-10" /> },
    { name: 'circle-equal', icon: <lucide.CircleEqual className="w-10 h-10" /> },
    { name: 'circle-help', icon: <lucide.CircleHelp className="w-10 h-10" /> },
    { name: 'circle-off', icon: <lucide.CircleOff className="w-10 h-10" /> },
    { name: 'circle-slash', icon: <lucide.CircleSlash className="w-10 h-10" /> },
    { name: 'circle-user', icon: <lucide.CircleUser className="w-10 h-10" /> },
    { name: 'circle-user-round', icon: <lucide.CircleUserRound className="w-10 h-10" /> },
    { name: 'circle-x', icon: <lucide.CircleX className="w-10 h-10" /> },
    { name: 'circuit-board', icon: <lucide.CircuitBoard className="w-10 h-10" /> },
    { name: 'citrus', icon: <lucide.Citrus className="w-10 h-10" /> },
    { name: 'clapperboard', icon: <lucide.Clapperboard className="w-10 h-10" /> },
    { name: 'clipboard-check', icon: <lucide.ClipboardCheck className="w-10 h-10" /> },
    { name: 'clipboard-copy', icon: <lucide.ClipboardCopy className="w-10 h-10" /> },
    { name: 'clipboard-list', icon: <lucide.ClipboardList className="w-10 h-10" /> },
    { name: 'clipboard-paste', icon: <lucide.ClipboardPaste className="w-10 h-10" /> },
    { name: 'clipboard-pen', icon: <lucide.ClipboardPen className="w-10 h-10" /> },
    { name: 'clipboard-plus', icon: <lucide.ClipboardPlus className="w-10 h-10" /> },
    { name: 'clipboard-x', icon: <lucide.ClipboardX className="w-10 h-10" /> },
    { name: 'clock-1', icon: <lucide.Clock1 className="w-10 h-10" /> },
    { name: 'clock-10', icon: <lucide.Clock10 className="w-10 h-10" /> },
    { name: 'clock-11', icon: <lucide.Clock11 className="w-10 h-10" /> },
    { name: 'clock-12', icon: <lucide.Clock12 className="w-10 h-10" /> },
    { name: 'clock-2', icon: <lucide.Clock2 className="w-10 h-10" /> },
    { name: 'clock-3', icon: <lucide.Clock3 className="w-10 h-10" /> },
    { name: 'clock-4', icon: <lucide.Clock4 className="w-10 h-10" /> },
    { name: 'clock-5', icon: <lucide.Clock5 className="w-10 h-10" /> },
    { name: 'clock-6', icon: <lucide.Clock6 className="w-10 h-10" /> },
    { name: 'clock-7', icon: <lucide.Clock7 className="w-10 h-10" /> },
    { name: 'clock-8', icon: <lucide.Clock8 className="w-10 h-10" /> },
    { name: 'clock-9', icon: <lucide.Clock9 className="w-10 h-10" /> },
    { name: 'cloud-cog', icon: <lucide.CloudCog className="w-10 h-10" /> },
    { name: 'cloud-drizzle', icon: <lucide.CloudDrizzle className="w-10 h-10" /> },
    { name: 'cloud-fog', icon: <lucide.CloudFog className="w-10 h-10" /> },
    { name: 'cloud-hail', icon: <lucide.CloudHail className="w-10 h-10" /> },
    { name: 'cloud-lightning', icon: <lucide.CloudLightning className="w-10 h-10" /> },
    { name: 'cloud-moon', icon: <lucide.CloudMoon className="w-10 h-10" /> },
    { name: 'cloud-moon-rain', icon: <lucide.CloudMoonRain className="w-10 h-10" /> },
    { name: 'cloud-off', icon: <lucide.CloudOff className="w-10 h-10" /> },
    { name: 'cloud-rain', icon: <lucide.CloudRain className="w-10 h-10" /> },
    { name: 'cloud-rain-wind', icon: <lucide.CloudRainWind className="w-10 h-10" /> },
    { name: 'cloud-snow', icon: <lucide.CloudSnow className="w-10 h-10" /> },
    { name: 'cloud-sun', icon: <lucide.CloudSun className="w-10 h-10" /> },
    { name: 'cloud-sun-rain', icon: <lucide.CloudSunRain className="w-10 h-10" /> },
    { name: 'cloudy', icon: <lucide.Cloudy className="w-10 h-10" /> },
    { name: 'clover', icon: <lucide.Clover className="w-10 h-10" /> },
    { name: 'club', icon: <lucide.Club className="w-10 h-10" /> },
    { name: 'code-2', icon: <lucide.Code2 className="w-10 h-10" /> },
    { name: 'code-xml', icon: <lucide.CodeXml className="w-10 h-10" /> },
    { name: 'codepen', icon: <lucide.Codepen className="w-10 h-10" /> },
    { name: 'codesandbox', icon: <lucide.Codesandbox className="w-10 h-10" /> },
    { name: 'cog', icon: <lucide.Cog className="w-10 h-10" /> },
    { name: 'coins', icon: <lucide.Coins className="w-10 h-10" /> },
    { name: 'columns-3', icon: <lucide.Columns3 className="w-10 h-10" /> },
    { name: 'columns-4', icon: <lucide.Columns4 className="w-10 h-10" /> },
    { name: 'combine', icon: <lucide.Combine className="w-10 h-10" /> },
    { name: 'command', icon: <lucide.Command className="w-10 h-10" /> },
    { name: 'component', icon: <lucide.Component className="w-10 h-10" /> },
    { name: 'computer', icon: <lucide.Computer className="w-10 h-10" /> },
    { name: 'concierge-bell', icon: <lucide.ConciergeBell className="w-10 h-10" /> },
    { name: 'construction', icon: <lucide.Construction className="w-10 h-10" /> },
    { name: 'contact', icon: <lucide.Contact className="w-10 h-10" /> },
    { name: 'contact-2', icon: <lucide.Contact2 className="w-10 h-10" /> },
    { name: 'container', icon: <lucide.Container className="w-10 h-10" /> },
    { name: 'contrast', icon: <lucide.Contrast className="w-10 h-10" /> },
    { name: 'cookie', icon: <lucide.Cookie className="w-10 h-10" /> },
    { name: 'cooking-pot', icon: <lucide.CookingPot className="w-10 h-10" /> },
    { name: 'copy', icon: <lucide.Copy className="w-10 h-10" /> },
    { name: 'copy-check', icon: <lucide.CopyCheck className="w-10 h-10" /> },
    { name: 'copy-minus', icon: <lucide.CopyMinus className="w-10 h-10" /> },
    { name: 'copy-plus', icon: <lucide.CopyPlus className="w-10 h-10" /> },
    { name: 'copy-slash', icon: <lucide.CopySlash className="w-10 h-10" /> },
    { name: 'copy-x', icon: <lucide.CopyX className="w-10 h-10" /> },
    { name: 'copyleft', icon: <lucide.Copyleft className="w-10 h-10" /> },
    { name: 'copyright', icon: <lucide.Copyright className="w-10 h-10" /> },
    { name: 'corner-down-left', icon: <lucide.CornerDownLeft className="w-10 h-10" /> },
    { name: 'corner-left-down', icon: <lucide.CornerLeftDown className="w-10 h-10" /> },
    { name: 'corner-left-up', icon: <lucide.CornerLeftUp className="w-10 h-10" /> },
    { name: 'corner-right-down', icon: <lucide.CornerRightDown className="w-10 h-10" /> },
    { name: 'corner-right-up', icon: <lucide.CornerRightUp className="w-10 h-10" /> },
    { name: 'creative-commons', icon: <lucide.CreativeCommons className="w-10 h-10" /> },
    { name: 'croissant', icon: <lucide.Croissant className="w-10 h-10" /> },
    { name: 'crop', icon: <lucide.Crop className="w-10 h-10" /> },
    { name: 'cross', icon: <lucide.Cross className="w-10 h-10" /> },
    { name: 'crosshair', icon: <lucide.Crosshair className="w-10 h-10" /> },
    { name: 'crown', icon: <lucide.Crown className="w-10 h-10" /> },
    { name: 'cuboid', icon: <lucide.Cuboid className="w-10 h-10" /> },
    { name: 'cup-soda', icon: <lucide.CupSoda className="w-10 h-10" /> },
    { name: 'currency', icon: <lucide.Currency className="w-10 h-10" /> },
    { name: 'cylinder', icon: <lucide.Cylinder className="w-10 h-10" /> },
    { name: 'database-backup', icon: <lucide.DatabaseBackup className="w-10 h-10" /> },
    { name: 'delete', icon: <lucide.Delete className="w-10 h-10" /> },
    { name: 'dessert', icon: <lucide.Dessert className="w-10 h-10" /> },
    { name: 'diff', icon: <lucide.Diff className="w-10 h-10" /> },
    { name: 'disc', icon: <lucide.Disc className="w-10 h-10" /> },
    { name: 'disc-2', icon: <lucide.Disc2 className="w-10 h-10" /> },
    { name: 'disc-3', icon: <lucide.Disc3 className="w-10 h-10" /> },
    { name: 'disc-album', icon: <lucide.DiscAlbum className="w-10 h-10" /> },
    { name: 'divide', icon: <lucide.Divide className="w-10 h-10" /> },
    { name: 'divide-circle', icon: <lucide.DivideCircle className="w-10 h-10" /> },
    { name: 'divide-square', icon: <lucide.DivideSquare className="w-10 h-10" /> },
    { name: 'dna-off', icon: <lucide.DnaOff className="w-10 h-10" /> },
    { name: 'dog', icon: <lucide.Dog className="w-10 h-10" /> },
    { name: 'donut', icon: <lucide.Donut className="w-10 h-10" /> },
    { name: 'door-closed', icon: <lucide.DoorClosed className="w-10 h-10" /> },
    { name: 'door-open', icon: <lucide.DoorOpen className="w-10 h-10" /> },
    { name: 'dot', icon: <lucide.Dot className="w-10 h-10" /> },
    { name: 'download-cloud', icon: <lucide.DownloadCloud className="w-10 h-10" /> },
    { name: 'drafting-compass', icon: <lucide.DraftingCompass className="w-10 h-10" /> },
    { name: 'drama', icon: <lucide.Drama className="w-10 h-10" /> },
    { name: 'dribbble', icon: <lucide.Dribbble className="w-10 h-10" /> },
    { name: 'drill', icon: <lucide.Drill className="w-10 h-10" /> },
    { name: 'droplet', icon: <lucide.Droplet className="w-10 h-10" /> },
    { name: 'droplets', icon: <lucide.Droplets className="w-10 h-10" /> },
    { name: 'drum', icon: <lucide.Drum className="w-10 h-10" /> },
    { name: 'drumstick', icon: <lucide.Drumstick className="w-10 h-10" /> },
    { name: 'dumbbell', icon: <lucide.Dumbbell className="w-10 h-10" /> },
    { name: 'ear', icon: <lucide.Ear className="w-10 h-10" /> },
    { name: 'ear-off', icon: <lucide.EarOff className="w-10 h-10" /> },
    { name: 'earth', icon: <lucide.Earth className="w-10 h-10" /> },
    { name: 'earth-lock', icon: <lucide.EarthLock className="w-10 h-10" /> },
    { name: 'eclipse', icon: <lucide.Eclipse className="w-10 h-10" /> },
    { name: 'egg', icon: <lucide.Egg className="w-10 h-10" /> },
    { name: 'egg-fried', icon: <lucide.EggFried className="w-10 h-10" /> },
    { name: 'egg-off', icon: <lucide.EggOff className="w-10 h-10" /> },
    { name: 'equal', icon: <lucide.Equal className="w-10 h-10" /> },
    { name: 'equal-not', icon: <lucide.EqualNot className="w-10 h-10" /> },
    { name: 'eraser', icon: <lucide.Eraser className="w-10 h-10" /> },
    { name: 'euro', icon: <lucide.Euro className="w-10 h-10" /> },
    { name: 'expand', icon: <lucide.Expand className="w-10 h-10" /> },
    { name: 'external-link', icon: <lucide.ExternalLink className="w-10 h-10" /> },
    { name: 'eye-off', icon: <lucide.EyeOff className="w-10 h-10" /> },
    { name: 'facebook', icon: <lucide.Facebook className="w-10 h-10" /> },
    { name: 'fan', icon: <lucide.Fan className="w-10 h-10" /> },
    { name: 'fast-forward', icon: <lucide.FastForward className="w-10 h-10" /> },
    { name: 'ferris-wheel', icon: <lucide.FerrisWheel className="w-10 h-10" /> },
    { name: 'figma', icon: <lucide.Figma className="w-10 h-10" /> },
    { name: 'file-archive', icon: <lucide.FileArchive className="w-10 h-10" /> },
    { name: 'file-audio', icon: <lucide.FileAudio className="w-10 h-10" /> },
    { name: 'file-audio-2', icon: <lucide.FileAudio2 className="w-10 h-10" /> },
    { name: 'file-axis-3d', icon: <lucide.FileAxis3d className="w-10 h-10" /> },
    { name: 'file-badge', icon: <lucide.FileBadge className="w-10 h-10" /> },
    { name: 'file-badge-2', icon: <lucide.FileBadge2 className="w-10 h-10" /> },
    { name: 'file-bar-chart', icon: <lucide.FileBarChart className="w-10 h-10" /> },
    { name: 'file-bar-chart-2', icon: <lucide.FileBarChart2 className="w-10 h-10" /> },
    { name: 'file-box', icon: <lucide.FileBox className="w-10 h-10" /> },
    { name: 'file-check', icon: <lucide.FileCheck className="w-10 h-10" /> },
    { name: 'file-check-2', icon: <lucide.FileCheck2 className="w-10 h-10" /> },
    { name: 'file-clock', icon: <lucide.FileClock className="w-10 h-10" /> },
    { name: 'file-code', icon: <lucide.FileCode className="w-10 h-10" /> },
    { name: 'file-code-2', icon: <lucide.FileCode2 className="w-10 h-10" /> },
    { name: 'file-cog', icon: <lucide.FileCog className="w-10 h-10" /> },
    { name: 'file-diff', icon: <lucide.FileDiff className="w-10 h-10" /> },
    { name: 'file-digit', icon: <lucide.FileDigit className="w-10 h-10" /> },
    { name: 'file-down', icon: <lucide.FileDown className="w-10 h-10" /> },
    { name: 'file-edit', icon: <lucide.FileEdit className="w-10 h-10" /> },
    { name: 'file-heart', icon: <lucide.FileHeart className="w-10 h-10" /> },
    { name: 'file-input', icon: <lucide.FileInput className="w-10 h-10" /> },
    { name: 'file-json', icon: <lucide.FileJson className="w-10 h-10" /> },
    { name: 'file-json-2', icon: <lucide.FileJson2 className="w-10 h-10" /> },
    { name: 'file-key', icon: <lucide.FileKey className="w-10 h-10" /> },
    { name: 'file-key-2', icon: <lucide.FileKey2 className="w-10 h-10" /> },
    { name: 'file-line-chart', icon: <lucide.FileLineChart className="w-10 h-10" /> },
    { name: 'file-lock', icon: <lucide.FileLock className="w-10 h-10" /> },
    { name: 'file-lock-2', icon: <lucide.FileLock2 className="w-10 h-10" /> },
    { name: 'file-minus', icon: <lucide.FileMinus className="w-10 h-10" /> },
    { name: 'file-minus-2', icon: <lucide.FileMinus2 className="w-10 h-10" /> },
    { name: 'file-music', icon: <lucide.FileMusic className="w-10 h-10" /> },
    { name: 'file-output', icon: <lucide.FileOutput className="w-10 h-10" /> },
    { name: 'file-pen', icon: <lucide.FilePen className="w-10 h-10" /> },
    { name: 'file-pen-line', icon: <lucide.FilePenLine className="w-10 h-10" /> },
    { name: 'file-pie-chart', icon: <lucide.FilePieChart className="w-10 h-10" /> },
    { name: 'file-plus', icon: <lucide.FilePlus className="w-10 h-10" /> },
    { name: 'file-plus-2', icon: <lucide.FilePlus2 className="w-10 h-10" /> },
];

const allDefinedShapes = [
  ...basicShapes,
  ...lucideShapes,
  ...extraShapes,
  ...geometricShapes,
  ...uiShapes,
  ...techShapes,
  ...businessShapes,
  ...natureShapes,
  ...arrowShapes,
  ...foodShapes,
  ...scienceShapes,
  ...buildingShapes,
  ...moreShapes,
];

const seen = new Set();
export const allShapes = allDefinedShapes.filter(el => {
  const duplicate = seen.has(el.name);
  if (!duplicate) {
    seen.add(el.name);
  }
  return !duplicate;
});

export function ShapeLibrary({ onAddShape, onAddImage, onAddSvgShape, isAdmin = false }: ShapeLibraryProps) {
  const [userShapes, setUserShapes] = useState<string[]>([]);
  const [serverShapes, setServerShapes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchServerShapes = async () => {
    try {
      const response = await fetch('/api/uploads/list');
      const data = await response.json();
      if (data.success) {
        const shapesFolder = data.folders.find((f: any) => f.name.toLowerCase() === 'shapes');
        if (shapesFolder) {
          setServerShapes(shapesFolder.files);
        }
      }
    } catch (error) {
      console.error("Failed to fetch server shapes", error);
    }
  };

  useEffect(() => {
    fetchServerShapes();
    try {
      const savedShapes = localStorage.getItem(USER_SHAPES_STORAGE_KEY);
      if (savedShapes) {
        setUserShapes(JSON.parse(savedShapes));
      }
    } catch (error) {
      console.error("Failed to load user shapes from localStorage", error);
    }
  }, []);

  const saveUserShapes = (shapes: string[]) => {
    try {
      localStorage.setItem(USER_SHAPES_STORAGE_KEY, JSON.stringify(shapes));
    } catch (error) {
      console.error("Failed to save user shapes to localStorage", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isAdmin) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'shapes');
      
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
          if (onAddSvgShape) onAddSvgShape(result.url);
          else onAddImage(result.url);
          fetchServerShapes(); // Refresh the list
        }
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newShapeSrc = event.target.result as string;
            const updatedShapes = [newShapeSrc, ...userShapes];
            setUserShapes(updatedShapes);
            saveUserShapes(updatedShapes);
            if (onAddSvgShape) onAddSvgShape(newShapeSrc);
            else onAddImage(newShapeSrc);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };
  
  const filteredShapes = searchTerm
    ? allShapes.filter(shape => shape.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : allShapes;


  return (
    <div className="flex flex-col h-full">
       <div className="p-2">
        <Input
          placeholder="Search shapes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 grid grid-cols-3 gap-2">
            <Label className={cn(
              "cursor-pointer aspect-square relative flex flex-col items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent text-foreground border-2 border-dashed",
              isUploading && "opacity-50 cursor-not-allowed"
            )}>
              {isUploading ? (
                <lucide.Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : (
                <lucide.Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <span className="mt-2 text-[10px] font-bold text-center text-muted-foreground group-hover:text-primary">
                {isAdmin ? 'Upload to Server' : 'Upload SVG'}
              </span>
              <Input
                type="file"
                accept=".svg, image/svg+xml"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Label>
          
          {/* User Local Shapes */}
          {userShapes.map((src, index) => (
            <div
              key={`user-shape-${index}`}
              title={`User Shape ${index + 1}`}
              className="cursor-pointer aspect-square relative flex items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent border border-border/20"
              onClick={() => onAddSvgShape ? onAddSvgShape(src) : onAddImage(src)}
            >
              <Image
                src={src}
                alt={`User Shape ${index + 1}`}
                fill
                className="object-contain p-2 transition-transform group-hover:scale-110"
              />
              <div className="absolute top-1 left-1 bg-primary/80 text-[8px] text-white px-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">Local</div>
            </div>
          ))}

          {/* Server Shared Shapes */}
          {serverShapes.map((url, index) => (
            <div
              key={`server-shape-${index}`}
              title={`Shared Shape ${index + 1}`}
              className="cursor-pointer aspect-square relative flex items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent border border-border/20 shadow-sm"
              onClick={() => onAddSvgShape ? onAddSvgShape(url) : onAddImage(url)}
            >
              <Image
                src={url}
                alt={`Shared Shape ${index + 1}`}
                fill
                className="object-contain p-2 transition-transform group-hover:scale-110"
              />
            </div>
          ))}

           {filteredShapes.map((shape) => (
            <div
              key={shape.name}
              title={shape.name}
              className="cursor-pointer aspect-square relative flex items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent text-foreground border border-border/10"
              onClick={() => onAddShape(shape.name)}
            >
              {shape.icon}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
