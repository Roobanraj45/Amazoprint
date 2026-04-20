'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type Emoji = {
  char: string;
  name: string;
};

type EmojiCategory = {
  [category: string]: Emoji[];
};


type EmojiLibraryProps = {
  onEmojiSelect: (emoji: string) => void;
};

export const emojiCategories: EmojiCategory = {
  'Smileys & People': [
    { char: '😀', name: 'grinning face' },
    { char: '😃', name: 'grinning face with big eyes' },
    { char: '😄', name: 'grinning face with smiling eyes' },
    { char: '😁', name: 'beaming face with smiling eyes' },
    { char: '😆', name: 'grinning squinting face' },
    { char: '😅', name: 'grinning face with sweat' },
    { char: '😂', name: 'face with tears of joy' },
    { char: '🤣', name: 'rolling on the floor laughing' },
    { char: '😊', name: 'smiling face with smiling eyes' },
    { char: '😇', name: 'smiling face with halo' },
    { char: '🙂', name: 'slightly smiling face' },
    { char: '🙃', name: 'upside-down face' },
    { char: '😉', name: 'winking face' },
    { char: '😌', name: 'relieved face' },
    { char: '😍', name: 'smiling face with heart-eyes' },
    { char: '🥰', name: 'smiling face with hearts' },
    { char: '😘', name: 'face blowing a kiss' },
    { char: '😗', name: 'kissing face' },
    { char: '😙', name: 'kissing face with smiling eyes' },
    { char: '😚', name: 'kissing face with closed eyes' },
    { char: '😋', name: 'face savoring food' },
    { char: '😛', name: 'face with tongue' },
    { char: '😝', name: 'squinting face with tongue' },
    { char: '😜', name: 'winking face with tongue' },
    { char: '🤪', name: 'zany face' },
    { char: '🤨', name: 'face with raised eyebrow' },
    { char: '🧐', name: 'face with monocle' },
    { char: '🤓', name: 'nerd face' },
    { char: '😎', name: 'smiling face with sunglasses' },
    { char: '🤩', name: 'star-struck' },
    { char: '🥳', name: 'partying face' },
    { char: '😏', name: 'smirking face' },
    { char: '😒', name: 'unamused face' },
    { char: '😞', name: 'disappointed face' },
    { char: '😔', name: 'pensive face' },
    { char: '😟', name: 'worried face' },
    { char: '😕', name: 'confused face' },
    { char: '🙁', name: 'slightly frowning face' },
    { char: '☹️', name: 'frowning face' },
    { char: '😣', name: 'persevering face' },
    { char: '😖', name: 'confounded face' },
    { char: '😫', name: 'tired face' },
    { char: '😩', name: 'weary face' },
    { char: '🥺', name: 'pleading face' },
    { char: '😢', name: 'crying face' },
    { char: '😭', name: 'loudly crying face' },
    { char: '😤', name: 'face with steam from nose' },
    { char: '😠', name: 'angry face' },
    { char: '😡', name: 'pouting face' },
    { char: '🤬', name: 'face with symbols on mouth' },
    { char: '🤯', name: 'exploding head' },
    { char: '😳', name: 'flushed face' },
    { char: '🥵', name: 'hot face' },
    { char: '🥶', name: 'cold face' },
    { char: '😱', name: 'face screaming in fear' },
    { char: '😨', name: 'fearful face' },
    { char: '😰', name: 'anxious face with sweat' },
    { char: '😥', name: 'sad but relieved face' },
    { char: '😓', name: 'downcast face with sweat' },
    { char: '🤗', name: 'hugging face' },
    { char: '🤔', name: 'thinking face' },
    { char: '🤭', name: 'face with hand over mouth' },
    { char: '🤫', name: 'shushing face' },
    { char: '🤥', name: 'lying face' },
    { char: '😶', name: 'face without mouth' },
    { char: '😐', name: 'neutral face' },
    { char: '😑', name: 'expressionless face' },
    { char: '😬', name: 'grimacing face' },
    { char: '🙄', name: 'face with rolling eyes' },
    { char: '😯', name: 'hushed face' },
    { char: '😦', name: 'frowning face with open mouth' },
    { char: '😧', name: 'anguished face' },
    { char: '😮', name: 'face with open mouth' },
    { char: '😲', name: 'astonished face' },
    { char: '🥱', name: 'yawning face' },
    { char: '😴', name: 'sleeping face' },
    { char: '🤤', name: 'drooling face' },
    { char: '😪', name: 'sleepy face' },
    { char: '😵', name: 'dizzy face' },
    { char: '🤐', name: 'zipper-mouth face' },
    { char: '🥴', name: 'woozy face' },
    { char: '🤢', name: 'nauseated face' },
    { char: '🤮', name: 'face vomiting' },
    { char: '🤧', name: 'sneezing face' },
    { char: '😷', name: 'face with medical mask' },
    { char: '🤒', name: 'face with thermometer' },
    { char: '🤕', name: 'face with head-bandage' },
    { char: '🤑', name: 'money-mouth face' },
    { char: '🤠', name: 'cowboy hat face' },
  ],
  'Animals & Nature': [
    { char: '🐶', name: 'dog face' }, { char: '🐱', name: 'cat face' }, { char: '🐭', name: 'mouse face' }, { char: '🐹', name: 'hamster' }, { char: '🐰', name: 'rabbit face' }, { char: '🦊', name: 'fox' }, { char: '🐻', name: 'bear' }, { char: '🐼', name: 'panda' }, { char: '🐨', name: 'koala' }, { char: '🐯', name: 'tiger face' }, { char: '🦁', name: 'lion' }, { char: '🐮', name: 'cow face' }, { char: '🐷', name: 'pig face' }, { char: '🐽', name: 'pig nose' }, { char: '🐸', name: 'frog' }, { char: '🐵', name: 'monkey face' }, { char: '🙈', name: 'see-no-evil monkey' }, { char: '🙉', name: 'hear-no-evil monkey' }, { char: '🙊', name: 'speak-no-evil monkey' }, { char: '🐒', name: 'monkey' }, { char: '🐔', name: 'chicken' }, { char: '🐧', name: 'penguin' }, { char: '🐦', name: 'bird' }, { char: '🐤', name: 'baby chick' }, { char: '🐣', name: 'hatching chick' }, { char: '🐥', name: 'front-facing baby chick' }, { char: '🦆', name: 'duck' }, { char: '🦅', name: 'eagle' }, { char: '🦉', name: 'owl' }, { char: '🦇', name: 'bat' }, { char: '🐺', name: 'wolf' }, { char: '🐗', name: 'boar' }, { char: '🐴', name: 'horse face' }, { char: '🦄', name: 'unicorn' }, { char: '🐝', name: 'honeybee' }, { char: '🐛', name: 'bug' }, { char: '🦋', name: 'butterfly' }, { char: '🐌', name: 'snail' }, { char: '🐞', name: 'lady beetle' }, { char: '🐜', name: 'ant' }, { char: '🦟', name: 'mosquito' }, { char: '🦗', name: 'cricket' }, { char: '🕷️', name: 'spider' }, { char: '🕸️', name: 'spider web' }, { char: '🦂', name: 'scorpion' }, { char: '🐢', name: 'turtle' }, { char: '🐍', name: 'snake' }, { char: '🦎', name: 'lizard' }, { char: '🦖', name: 'T-Rex' }, { char: '🦕', name: 'sauropod' }, { char: '🐙', name: 'octopus' }, { char: '🐡', name: 'blowfish' }, { char: '🐠', name: 'tropical fish' }, { char: '🐟', name: 'fish' }, { char: '🐬', name: 'dolphin' }, { char: '🐳', name: 'spouting whale' }, { char: '🐋', name: 'whale' }, { char: '🦈', name: 'shark' }, { char: '🐊', name: 'crocodile' }, { char: '🐅', name: 'tiger' }, { char: '🐆', name: 'leopard' }, { char: '🦓', name: 'zebra' }, { char: '🦍', name: 'gorilla' }, { char: '🦧', name: 'orangutan' }, { char: '🐘', name: 'elephant' }, { char: '🦛', name: 'hippopotamus' }, { char: '🦏', name: 'rhinoceros' }, { char: '🐪', name: 'camel' }, { char: '🐫', name: 'two-hump camel' }, { char: '🦒', name: 'giraffe' }, { char: '🦘', name: 'kangaroo' }, { char: '🐃', name: 'water buffalo' }, { char: '🐂', name: 'ox' }, { char: '🐄', name: 'cow' }, { char: '🐎', name: 'horse' }, { char: '🐖', name: 'pig' }, { char: '🐏', name: 'ram' }, { char: '🐑', name: 'ewe' }, { char: '🦙', name: 'llama' }, { char: '🐐', name: 'goat' }, { char: '🦌', name: 'deer' }, { char: '🐕', name: 'dog' }, { char: '🐩', name: 'poodle' }, { char: '🦮', name: 'guide dog' }, { char: '🐕‍🦺', name: 'service dog' }, { char: '🐈', name: 'cat' }, { char: '🐓', name: 'rooster' }, { char: '🦃', name: 'turkey' }, { char: '🦚', name: 'peacock' }, { char: '🦜', name: 'parrot' }, { char: '🦢', name: 'swan' }, { char: '🦩', name: 'flamingo' }, { char: '🕊️', name: 'dove' }, { char: '🐇', name: 'rabbit' }, { char: '🦝', name: 'raccoon' }, { char: '🦨', name: 'skunk' }, { char: '🦡', name: 'badger' }, { char: '🦦', name: 'otter' }, { char: '🦥', name: 'sloth' }, { char: '🐁', name: 'mouse' }, { char: '🐀', name: 'rat' }, { char: '🐿️', name: 'chipmunk' }, { char: '🦔', name: 'hedgehog' }, { char: '🐾', name: 'paw prints' }, { char: '🐉', name: 'dragon' }, { char: '🐲', name: 'dragon face' }, { char: '🌵', name: 'cactus' }, { char: '🎄', name: 'Christmas tree' }, { char: '🌲', name: 'evergreen tree' }, { char: '🌳', name: 'deciduous tree' }, { char: '🌴', name: 'palm tree' }, { char: '🌱', name: 'seedling' }, { char: '🌿', name: 'herb' }, { char: '☘️', name: 'shamrock' }, { char: '🍀', name: 'four leaf clover' }, { char: '🎍', name: 'pine decoration' }, { char: '🎋', name: 'tanabata tree' }, { char: '🍃', name: 'leaf fluttering in wind' }, { char: '🍂', name: 'fallen leaf' }, { char: '🍁', name: 'maple leaf' }, { char: '🐚', name: 'spiral shell' }, { char: '🌾', name: 'sheaf of rice' }, { char: '💐', name: 'bouquet' }, { char: '🌷', name: 'tulip' }, { char: '🌹', name: 'rose' }, { char: '🥀', name: 'wilted flower' }, { char: '🌺', name: 'hibiscus' }, { char: '🌸', name: 'cherry blossom' }, { char: '🌼', name: 'blossom' }, { char: '🌻', name: 'sunflower' }, { char: '🌞', name: 'sun with face' }, { char: '🌝', name: 'full moon face' }, { char: '🌛', name: 'first quarter moon face' }, { char: '🌜', name: 'last quarter moon face' }, { char: '🌚', name: 'new moon face' }, { char: '🌕', name: 'full moon' }, { char: '🌖', name: 'waning gibbous moon' }, { char: '🌗', name: 'last quarter moon' }, { char: '🌘', name: 'waning crescent moon' }, { char: '🌑', name: 'new moon' }, { char: '🌒', name: 'waxing crescent moon' }, { char: '🌓', name: 'first quarter moon' }, { char: '🌔', name: 'waxing gibbous moon' }, { char: '🌙', name: 'crescent moon' }, { char: '🌎', name: 'globe showing Americas' }, { char: '🌍', name: 'globe showing Europe-Africa' }, { char: '🌏', name: 'globe showing Asia-Australia' }, { char: '💫', name: 'dizzy' }, { char: '⭐️', name: 'star' }, { char: '🌟', name: 'glowing star' }, { char: '✨', name: 'sparkles' }, { char: '⚡️', name: 'high voltage' }, { char: '☄️', name: 'comet' }, { char: '💥', name: 'collision' }, { char: '🔥', name: 'fire' }, { char: '🌪️', name: 'tornado' }, { char: '🌈', name: 'rainbow' }, { char: '☀️', name: 'sun' }, { char: '🌤️', name: 'sun behind small cloud' }, { char: '⛅️', name: 'sun behind cloud' }, { char: '🌥️', name: 'sun behind large cloud' }, { char: '☁️', name: 'cloud' }, { char: '🌦️', name: 'sun behind rain cloud' }, { char: '🌧️', name: 'cloud with rain' }, { char: '⛈️', name: 'cloud with lightning and rain' }, { char: '🌩️', name: 'cloud with lightning' }, { char: '🌨️', name: 'cloud with snow' }, { char: '❄️', name: 'snowflake' }, { char: '☃️', name: 'snowman' }, { char: '⛄️', name: 'snowman without snow' }, { char: '🌬️', name: 'wind face' }, { char: '💨', name: 'dashing away' }, { char: '💧', name: 'droplet' }, { char: '💦', name: 'sweat droplets' }, { char: '☔️', name: 'umbrella with rain drops' }, { char: '☂️', name: 'umbrella' }, { char: '🌊', name: 'water wave' }, { char: '🌫️', name: 'fog' },
  ],
  'Food & Drink': [
    { char: '🍇', name: 'grapes' }, { char: '🍈', name: 'melon' }, { char: '🍉', name: 'watermelon' }, { char: '🍊', name: 'tangerine' }, { char: '🍋', name: 'lemon' }, { char: '🍌', name: 'banana' }, { char: '🍍', name: 'pineapple' }, { char: '🥭', name: 'mango' }, { char: '🍎', name: 'red apple' }, { char: '🍏', name: 'green apple' }, { char: '🍐', name: 'pear' }, { char: '🍑', name: 'peach' }, { char: '🍒', name: 'cherries' }, { char: '🍓', name: 'strawberry' }, { char: '🥝', name: 'kiwi fruit' }, { char: '🍅', name: 'tomato' }, { char: '🥥', name: 'coconut' }, { char: '🥑', name: 'avocado' }, { char: '🍆', name: 'eggplant' }, { char: '🥔', name: 'potato' }, { char: '🥕', name: 'carrot' }, { char: '🌽', name: 'ear of corn' }, { char: '🌶️', name: 'hot pepper' }, { char: '🥒', name: 'cucumber' }, { char: '🥬', name: 'leafy green' }, { char: '🥦', name: 'broccoli' }, { char: '🧄', name: 'garlic' }, { char: '🧅', name: 'onion' }, { char: '🍄', name: 'mushroom' }, { char: '🥜', name: 'peanuts' }, { char: '🌰', name: 'chestnut' }, { char: '🍞', name: 'bread' }, { char: '🥐', name: 'croissant' }, { char: '🥖', name: 'baguette bread' }, { char: '🥨', name: 'pretzel' }, { char: '🥯', name: 'bagel' }, { char: '🥞', name: 'pancakes' }, { char: '🧇', name: 'waffle' }, { char: '🧀', name: 'cheese wedge' }, { char: '🍖', name: 'meat on bone' }, { char: '🍗', name: 'poultry leg' }, { char: '🥩', name: 'cut of meat' }, { char: '🥓', name: 'bacon' }, { char: '🍔', name: 'hamburger' }, { char: '🍟', name: 'french fries' }, { char: '🍕', name: 'pizza' }, { char: '🌭', name: 'hot dog' }, { char: '🥪', name: 'sandwich' }, { char: '🌮', name: 'taco' }, { char: '🌯', name: 'burrito' }, { char: '🥙', name: 'stuffed flatbread' }, { char: '🧆', name: 'falafel' }, { char: '🥚', name: 'egg' }, { char: '🍳', name: 'cooking' }, { char: '🥘', name: 'shallow pan of food' }, { char: '🍲', name: 'pot of food' }, { char: '🥣', name: 'bowl with spoon' }, { char: '🥗', name: 'green salad' }, { char: '🍿', name: 'popcorn' }, { char: '🧈', name: 'butter' }, { char: '🧂', name: 'salt' }, { char: '🥫', name: 'canned food' }, { char: '🍱', name: 'bento box' }, { char: '🍘', name: 'rice cracker' }, { char: '🍙', name: 'rice ball' }, { char: '🍚', name: 'cooked rice' }, { char: '🍛', name: 'curry rice' }, { char: '🍜', name: 'steaming bowl' }, { char: '🍝', name: 'spaghetti' }, { char: '🍠', name: 'roasted sweet potato' }, { char: '🍢', name: 'oden' }, { char: '🍣', name: 'sushi' }, { char: '🍤', name: 'fried shrimp' }, { char: '🍥', name: 'fish cake with swirl' }, { char: '🥮', name: 'moon cake' }, { char: '🍡', name: 'dango' }, { char: '🥟', name: 'dumpling' }, { char: '🥠', name: 'fortune cookie' }, { char: '🥡', name: 'takeout box' }, { char: '🦀', name: 'crab' }, { char: '🦞', name: 'lobster' }, { char: '🦐', name: 'shrimp' }, { char: '🦑', name: 'squid' }, { char: '🦪', name: 'oyster' }, { char: '🍦', name: 'soft ice cream' }, { char: '🍧', name: 'shaved ice' }, { char: '🍨', name: 'ice cream' }, { char: '🍩', name: 'doughnut' }, { char: '🍪', name: 'cookie' }, { char: '🎂', name: 'birthday cake' }, { char: '🍰', name: 'shortcake' }, { char: '🧁', name: 'cupcake' }, { char: '🥧', name: 'pie' }, { char: '🍫', name: 'chocolate bar' }, { char: '🍬', name: 'candy' }, { char: '🍭', name: 'lollipop' }, { char: '🍮', name: 'custard' }, { char: '🍯', name: 'honey pot' }, { char: '🍼', name: 'baby bottle' }, { char: '🥛', name: 'glass of milk' }, { char: '☕️', name: 'hot beverage' }, { char: '🍵', name: 'teacup without handle' }, { char: '🍶', name: 'sake' }, { char: '🍾', name: 'bottle with popping cork' }, { char: '🍷', name: 'wine glass' }, { char: '🍸', name: 'cocktail glass' }, { char: '🍹', name: 'tropical drink' }, { char: '🍺', name: 'beer mug' }, { char: '🍻', name: 'clinking beer mugs' }, { char: '🥂', name: 'clinking glasses' }, { char: '🥃', name: 'tumbler glass' }, { char: '🥤', name: 'cup with straw' }, { char: '🧃', name: 'beverage box' }, { char: '🧉', name: 'mate' }, { char: '🧊', name: 'ice' }, { char: '🥢', name: 'chopsticks' }, { char: '🍽️', name: 'fork and knife with plate' }, { char: '🍴', name: 'fork and knife' }, { char: '🥄', name: 'spoon' },
  ],
  Objects: [
    { char: '⌚️', name: 'watch' }, { char: '📱', name: 'mobile phone' }, { char: '📲', name: 'mobile phone with arrow' }, { char: '💻', name: 'laptop' }, { char: '⌨️', name: 'keyboard' }, { char: '🖥️', name: 'desktop computer' }, { char: '🖨️', name: 'printer' }, { char: '🖱️', name: 'computer mouse' }, { char: '🖲️', name: 'trackball' }, { char: '🕹️', name: 'joystick' }, { char: '🗜️', name: 'clamp' }, { char: '💽', name: 'computer disk' }, { char: '💾', name: 'floppy disk' }, { char: '💿', name: 'optical disk' }, { char: '📀', name: 'dvd' }, { char: '📼', name: 'videocassette' }, { char: '📷', name: 'camera' }, { char: '📸', name: 'camera with flash' }, { char: '📹', name: 'video camera' }, { char: '🎥', name: 'movie camera' }, { char: '📽️', name: 'film projector' }, { char: '🎞️', name: 'film frames' }, { char: '📞', name: 'telephone receiver' }, { char: '☎️', name: 'telephone' }, { char: '📟', name: 'pager' }, { char: '📠', name: 'fax machine' }, { char: '📺', name: 'television' }, { char: '📻', name: 'radio' }, { char: '🎙️', name: 'studio microphone' }, { char: '🎚️', name: 'level slider' }, { char: '🎛️', name: 'control knobs' }, { char: '🧭', name: 'compass' }, { char: '⏱️', name: 'stopwatch' }, { char: '⏲️', name: 'timer clock' }, { char: '⏰', name: 'alarm clock' }, { char: '🕰️', name: 'mantelpiece clock' }, { char: '⏳', name: 'hourglass done' }, { char: '⌛️', name: 'hourglass not done' }, { char: '📡', name: 'satellite antenna' }, { char: '🔋', name: 'battery' }, { char: '🔌', name: 'electric plug' }, { char: '💡', name: 'light bulb' }, { char: '🔦', name: 'flashlight' }, { char: '🕯️', name: 'candle' }, { char: '🪔', name: 'diya lamp' }, { char: '🧯', name: 'fire extinguisher' }, { char: '🛢️', name: 'oil drum' }, { char: '💸', name: 'money with wings' }, { char: '💵', name: 'dollar banknote' }, { char: '💴', name: 'yen banknote' }, { char: '💶', name: 'euro banknote' }, { char: '💷', name: 'pound banknote' }, { char: '💰', name: 'money bag' }, { char: '💳', name: 'credit card' }, { char: '💎', name: 'gem stone' }, { char: '⚖️', name: 'balance scale' }, { char: '🧰', name: 'toolbox' }, { char: '🔧', name: 'wrench' }, { char: '🔨', name: 'hammer' }, { char: '⚒️', name: 'hammer and pick' }, { char: '🛠️', name: 'hammer and wrench' }, { char: '⛏️', name: 'pick' }, { char: '🔩', name: 'nut and bolt' }, { char: '⚙️', name: 'gear' }, { char: '🧱', name: 'brick' }, { char: '⛓️', name: 'chains' }, { char: '🧲', name: 'magnet' }, { char: '🔫', name: 'pistol' }, { char: '💣', name: 'bomb' }, { char: '🧨', name: 'firecracker' }, { char: '🪓', name: 'axe' }, { char: '🔪', name: 'kitchen knife' }, { char: '🗡️', name: 'dagger' }, { char: '⚔️', name: 'crossed swords' }, { char: '🛡️', name: 'shield' }, { char: '🚬', name: 'cigarette' }, { char: '⚰️', name: 'coffin' }, { char: '⚱️', name: 'funeral urn' }, { char: '🏺', name: 'amphora' }, { char: '🔮', name: 'crystal ball' }, { char: '📿', name: 'prayer beads' }, { char: '🧿', name: 'nazar amulet' }, { char: '💈', name: 'barber pole' }, { char: '⚗️', name: 'alembic' }, { char: '🔭', name: 'telescope' }, { char: '🔬', name: 'microscope' }, { char: '🕳️', name: 'hole' }, { char: '🩹', name: 'adhesive bandage' }, { char: '🩺', name: 'stethoscope' }, { char: '💊', name: 'pill' }, { char: '💉', name: 'syringe' }, { char: '🩸', name: 'drop of blood' }, { char: '🧬', name: 'dna' }, { char: '🦠', name: 'microbe' }, { char: '🧫', name: 'petri dish' }, { char: '🧪', name: 'test tube' }, { char: '🌡️', name: 'thermometer' }, { char: '🧹', name: 'broom' }, { char: '🧺', name: 'basket' }, { char: '🧻', name: 'roll of paper' }, { char: '🚽', name: 'toilet' }, { char: '🚰', name: 'potable water' }, { char: '🚿', name: 'shower' }, { char: '🛁', name: 'bathtub' }, { char: '🛀', name: 'person taking bath' }, { char: '🧼', name: 'soap' }, { char: '🪒', name: 'razor' }, { char: '🧽', name: 'sponge' }, { char: '🧴', name: 'lotion bottle' }, { char: '🛎️', name: 'bellhop bell' }, { char: '🔑', name: 'key' }, { char: '🗝️', name: 'old key' }, { char: '🚪', name: 'door' }, { char: '🪑', name: 'chair' }, { char: '🛋️', name: 'couch and lamp' }, { char: '🛏️', name: 'bed' }, { char: '🛌', name: 'person in bed' }, { char: '🧸', name: 'teddy bear' }, { char: '🖼️', name: 'framed picture' }, { char: '🛍️', name: 'shopping bags' }, { char: '🛒', name: 'shopping cart' }, { char: '🎁', name: 'wrapped gift' }, { char: '🎈', name: 'balloon' }, { char: '🎏', name: 'carp streamer' }, { char: '🎀', name: 'ribbon' }, { char: '🎊', name: 'confetti ball' }, { char: '🎉', name: 'party popper' }, { char: '🎎', name: 'Japanese dolls' }, { char: '🏮', name: 'red paper lantern' }, { char: '🎐', name: 'wind chime' }, { char: '🧧', name: 'red envelope' }, { char: '✉️', name: 'envelope' }, { char: '📩', name: 'envelope with arrow' }, { char: '📨', name: 'incoming envelope' }, { char: '📧', name: 'e-mail' }, { char: '💌', name: 'love letter' }, { char: '📮', name: 'postbox' }, { char: '📪', name: 'closed mailbox with lowered flag' }, { char: '📫', name: 'closed mailbox with raised flag' }, { char: '📬', name: 'open mailbox with raised flag' }, { char: '📭', name: 'open mailbox with lowered flag' }, { char: '📦', name: 'package' }, { char: '📯', name: 'postal horn' }, { char: '📥', name: 'inbox tray' }, { char: '📤', name: 'outbox tray' }, { char: '📜', name: 'scroll' }, { char: '📃', name: 'page with curl' }, { char: '📄', name: 'page facing up' }, { char: '📑', name: 'bookmark tabs' }, { char: '🧾', name: 'receipt' }, { char: '📊', name: 'bar chart' }, { char: '📈', name: 'chart increasing' }, { char: '📉', name: 'chart decreasing' }, { char: '🗒️', name: 'spiral notepad' }, { char: '🗓️', name: 'spiral calendar' }, { char: '📆', name: 'tear-off calendar' }, { char: '📅', name: 'calendar' }, { char: '🗑️', name: 'wastebasket' }, { char: '📇', name: 'card index' }, { char: '🗃️', name: 'card file box' }, { char: '🗳️', name: 'ballot box with ballot' }, { char: '🗄️', name: 'file cabinet' }, { char: '📋', name: 'clipboard' }, { char: '📁', name: 'file folder' }, { char: '📂', name: 'open file folder' }, { char: '🗂️', name: 'card index dividers' }, { char: '🗞️', name: 'newspaper' }, { char: '📰', name: 'newspaper' }, { char: '📓', name: 'notebook' }, { char: '📔', name: 'notebook with decorative cover' }, { char: '📒', name: 'ledger' }, { char: '📕', name: 'closed book' }, { char: '📗', name: 'green book' }, { char: '📘', name: 'blue book' }, { char: '📙', name: 'orange book' }, { char: '📚', name: 'books' }, { char: '📖', name: 'open book' }, { char: '🔖', name: 'bookmark' }, { char: '🧷', name: 'safety pin' }, { char: '🔗', name: 'link' }, { char: '📎', name: 'paperclip' }, { char: '🖇️', name: 'linked paperclips' }, { char: '📐', name: 'triangular ruler' }, { char: '📏', name: 'straight ruler' }, { char: '🧮', name: 'abacus' }, { char: '📌', name: 'pushpin' }, { char: '📍', name: 'round pushpin' }, { char: '✂️', name: 'scissors' }, { char: '🖊️', name: 'pen' }, { char: '🖋️', name: 'fountain pen' }, { char: '✒️', name: 'black nib' }, { char: '🖌️', name: 'paintbrush' }, { char: '🖍️', name: 'crayon' }, { char: '📝', name: 'memo' }, { char: '✏️', name: 'pencil' }, { char: '🔍', name: 'magnifying glass tilted left' }, { char: '🔎', name: 'magnifying glass tilted right' }, { char: '🔏', name: 'locked with pen' }, { char: '🔐', name: 'locked with key' }, { char: '🔒', name: 'locked' }, { char: '🔓', name: 'unlocked' },
  ],
  Symbols: [
    { char: '❤️', name: 'red heart' }, { char: '🧡', name: 'orange heart' }, { char: '💛', name: 'yellow heart' }, { char: '💚', name: 'green heart' }, { char: '💙', name: 'blue heart' }, { char: '💜', name: 'purple heart' }, { char: '🖤', name: 'black heart' }, { char: '🤍', name: 'white heart' }, { char: '🤎', name: 'brown heart' }, { char: '💔', name: 'broken heart' }, { char: '❣️', name: 'heart exclamation' }, { char: '💕', name: 'two hearts' }, { char: '💞', name: 'revolving hearts' }, { char: '💓', name: 'beating heart' }, { char: '💗', name: 'growing heart' }, { char: '💖', name: 'sparkling heart' }, { char: '💘', name: 'heart with arrow' }, { char: '💝', name: 'heart with ribbon' }, { char: '💟', name: 'heart decoration' }, { char: '☮️', name: 'peace symbol' }, { char: '✝️', name: 'latin cross' }, { char: '☪️', name: 'star and crescent' }, { char: '🕉️', name: 'om' }, { char: '☸️', name: 'wheel of dharma' }, { char: '✡️', name: 'star of David' }, { char: '🔯', name: 'dotted six-pointed star' }, { char: '🕎', name: 'menorah' }, { char: '☯️', name: 'yin yang' }, { char: '☦️', name: 'orthodox cross' }, { char: '🛐', name: 'place of worship' }, { char: '⛎', name: 'Ophiuchus' }, { char: '♈️', name: 'Aries' }, { char: '♉️', name: 'Taurus' }, { char: '♊️', name: 'Gemini' }, { char: '♋️', name: 'Cancer' }, { char: '♌️', name: 'Leo' }, { char: '♍️', name: 'Virgo' }, { char: '♎️', name: 'Libra' }, { char: '♏️', name: 'Scorpio' }, { char: '♐️', name: 'Sagittarius' }, { char: '♑️', name: 'Capricorn' }, { char: '♒️', name: 'Aquarius' }, { char: '♓️', name: 'Pisces' }, { char: '🆔', name: 'ID button' }, { char: '⚛️', name: 'atom symbol' }, { char: '🉑', name: 'Japanese “acceptable” button' }, { char: '☢️', name: 'radioactive' }, { char: '☣️', name: 'biohazard' }, { char: '📴', name: 'mobile phone off' }, { char: '📳', name: 'vibration mode' }, { char: '🈶', name: 'Japanese “not free of charge” button' }, { char: '🈚️', name: 'Japanese “free of charge” button' }, { char: '🈸', name: 'Japanese “application” button' }, { char: '🈺', name: 'Japanese “open for business” button' }, { char: '🈷️', name: 'Japanese “monthly amount” button' }, { char: '✴️', name: 'eight-pointed star' }, { char: '🆚', name: 'VS button' }, { char: '💮', name: 'white flower' }, { char: '🉐', name: 'Japanese “bargain” button' }, { char: '㊙️', name: 'Japanese “secret” button' }, { char: '㊗️', name: 'Japanese “congratulations” button' }, { char: '🈴', name: 'Japanese “passing grade” button' }, { char: '🈵', name: 'Japanese “no vacancy” button' }, { char: '🈹', name: 'Japanese “discount” button' }, { char: '🈲', name: 'Japanese “prohibited” button' }, { char: '🅰️', name: 'A button (blood type)' }, { char: '🅱️', name: 'B button (blood type)' }, { char: '🆎', name: 'AB button (blood type)' }, { char: '🆑', name: 'CL button' }, { char: '🅾️', name: 'O button (blood type)' }, { char: '🆘', name: 'SOS button' }, { char: '❌', name: 'cross mark' }, { char: '⭕️', name: 'hollow red circle' }, { char: '🛑', name: 'stop sign' }, { char: '⛔️', name: 'no entry' }, { char: '📛', name: 'name badge' }, { char: '🚫', name: 'prohibited' }, { char: '💯', name: 'hundred points' }, { char: '💢', name: 'anger symbol' }, { char: '♨️', name: 'hot springs' }, { char: '🚷', name: 'no pedestrians' }, { char: '🚯', name: 'no littering' }, { char: '🚳', name: 'no bicycles' }, { char: '🚱', name: 'non-potable water' }, { char: '🔞', name: 'no one under eighteen' }, { char: '📵', name: 'no mobile phones' }, { char: '🚭', name: 'no smoking' }, { char: '❗️', name: 'red exclamation mark' }, { char: '❕', name: 'white exclamation mark' }, { char: '❓', name: 'red question mark' }, { char: '❔', name: 'white question mark' }, { char: '‼️', name: 'double exclamation mark' }, { char: '⁉️', name: 'exclamation question mark' }, { char: '🔅', name: 'dim button' }, { char: '🔆', name: 'bright button' }, { char: '〽️', name: 'part alternation mark' }, { char: '⚠️', name: 'warning' }, { char: '🚸', name: 'children crossing' }, { char: '🔱', name: 'trident emblem' }, { char: '⚜️', name: 'fleur-de-lis' }, { char: '🔰', name: 'Japanese symbol for beginner' }, { char: '♻️', name: 'recycling symbol' }, { char: '✅', name: 'check mark button' }, { char: '🈯️', name: 'Japanese “reserved” button' }, { char: '💹', name: 'chart increasing with yen' }, { char: '❇️', name: 'sparkle' }, { char: '✳️', name: 'eight-spoked asterisk' }, { char: '❎', name: 'cross mark button' }, { char: '🌐', name: 'globe with meridians' }, { char: '💠', name: 'diamond with a dot' }, { char: 'Ⓜ️', name: 'circled M' }, { char: '🌀', name: 'cyclone' }, { char: '💤', name: 'zzz' }, { char: '🏧', name: 'ATM sign' }, { char: '🚾', name: 'water closet' }, { char: '♿️', name: 'wheelchair symbol' }, { char: '🅿️', name: 'P button' }, { char: '🈳', name: 'Japanese “vacancy” button' }, { char: '🈂️', name: 'Japanese “service charge” button' }, { char: '🛂', name: 'passport control' }, { char: '🛃', name: 'customs' }, { char: '🛄', name: 'baggage claim' }, { char: '🛅', name: 'left luggage' }, { char: '🚹', name: 'men’s room' }, { char: '🚺', name: 'women’s room' }, { char: '🚼', name: 'baby symbol' }, { char: '🚻', name: 'restroom' }, { char: '🚮', name: 'litter in bin sign' }, { char: '🎦', name: 'cinema' }, { char: '📶', name: 'antenna bars' }, { char: '🈁', name: 'Japanese “here” button' }, { char: '🔣', name: 'input symbols' }, { char: 'ℹ️', name: 'information' }, { char: '🔤', name: 'input latin letters' }, { char: '🔡', name: 'input latin lowercase' }, { char: '🔠', name: 'input latin uppercase' }, { char: '🆖', name: 'NG button' }, { char: '🆗', name: 'OK button' }, { char: '🆙', name: 'UP! button' }, { char: '🆒', name: 'COOL button' }, { char: '🆕', name: 'NEW button' }, { char: '🆓', name: 'FREE button' }, { char: '0️⃣', name: 'keycap: 0' }, { char: '1️⃣', name: 'keycap: 1' }, { char: '2️⃣', name: 'keycap: 2' }, { char: '3️⃣', name: 'keycap: 3' }, { char: '4️⃣', name: 'keycap: 4' }, { char: '5️⃣', name: 'keycap: 5' }, { char: '6️⃣', name: 'keycap: 6' }, { char: '7️⃣', name: 'keycap: 7' }, { char: '8️⃣', name: 'keycap: 8' }, { char: '9️⃣', name: 'keycap: 9' }, { char: '🔟', name: 'keycap: 10' }, { char: '🔢', name: 'input numbers' }, { char: '#️⃣', name: 'keycap: #' }, { char: '*️⃣', name: 'keycap: *' }, { char: '⏏️', name: 'eject button' }, { char: '▶️', name: 'play button' }, { char: '⏸️', name: 'pause button' }, { char: '⏯️', name: 'play or pause button' }, { char: '⏹️', name: 'stop button' }, { char: '⏺️', name: 'record button' }, { char: '⏭️', name: 'next track button' }, { char: '⏮️', name: 'last track button' }, { char: '⏩', name: 'fast-forward button' }, { char: '⏪', name: 'fast reverse button' }, { char: '⏫', name: 'fast up button' }, { char: '⏬', name: 'fast down button' }, { char: '◀️', name: 'reverse button' }, { char: '🔼', name: 'upwards button' }, { char: '🔽', name: 'downwards button' }, { char: '➡️', name: 'right arrow' }, { char: '⬅️', name: 'left arrow' }, { char: '⬆️', name: 'up arrow' }, { char: '⬇️', name: 'down arrow' }, { char: '↗️', name: 'up-right arrow' }, { char: '↘️', name: 'down-right arrow' }, { char: '↙️', name: 'down-left arrow' }, { char: '↖️', name: 'up-left arrow' }, { char: '↕️', name: 'up-down arrow' }, { char: '↔️', name: 'left-right arrow' }, { char: '↪️', name: 'right arrow curving left' }, { char: '↩️', name: 'left arrow curving right' }, { char: '⤴️', name: 'right arrow curving up' }, { char: '⤵️', name: 'right arrow curving down' }, { char: '🔀', name: 'shuffle tracks button' }, { char: '🔁', name: 'repeat button' }, { char: '🔂', name: 'repeat single button' }, { char: '🔄', name: 'counterclockwise arrows button' }, { char: '🔃', name: 'clockwise vertical arrows' }, { char: '🎵', name: 'musical note' }, { char: '🎶', name: 'musical notes' }, { char: '➕', name: 'plus' }, { char: '➖', name: 'minus' }, { char: '➗', name: 'divide' }, { char: '✖️', name: 'multiply' }, { char: '♾️', name: 'infinity' }, { char: '💲', name: 'heavy dollar sign' }, { char: '💱', name: 'currency exchange' }, { char: '™️', name: 'trade mark' }, { char: '©️', name: 'copyright' }, { char: '®️', name: 'registered' }, { char: '〰️', name: 'wavy dash' }, { char: '➰', name: 'curly loop' }, { char: '➿', name: 'double curly loop' }, { char: '🔚', name: 'END arrow' }, { char: '🔙', name: 'BACK arrow' }, { char: '🔛', name: 'ON! arrow' }, { char: '🔝', name: 'TOP arrow' }, { char: '🔜', name: 'SOON arrow' }, { char: '✔️', name: 'check mark' }, { char: '☑️', name: 'check box with check' }, { char: '🔘', name: 'radio button' }, { char: '🔴', name: 'red circle' }, { char: '🟠', name: 'orange circle' }, { char: '🟡', name: 'yellow circle' }, { char: '🟢', name: 'green circle' }, { char: '🔵', name: 'blue circle' }, { char: '🟣', name: 'purple circle' }, { char: '⚫️', name: 'black circle' }, { char: '⚪️', name: 'white circle' }, { char: '🟤', name: 'brown circle' }, { char: '🔺', name: 'red triangle pointed up' }, { char: '🔻', name: 'red triangle pointed down' }, { char: '🔶', name: 'large orange diamond' }, { char: '🔷', name: 'large blue diamond' }, { char: '🔸', name: 'small orange diamond' }, { char: '🔹', name: 'small blue diamond' }, { char: '▪️', name: 'black small square' }, { char: '▫️', name: 'white small square' }, { char: '◾️', name: 'black medium-small square' }, { char: '◽️', name: 'white medium-small square' }, { char: '◼️', name: 'black medium square' }, { char: '◻️', name: 'white medium square' }, { char: '🟥', name: 'red square' }, { char: '🟧', name: 'orange square' }, { char: '🟨', name: 'yellow square' }, { char: '🟩', name: 'green square' }, { char: '🟦', name: 'blue square' }, { char: '🟪', name: 'purple square' }, { char: '⬛️', name: 'black large square' }, { char: '⬜️', name: 'white large square' }, { char: '🟫', name: 'brown square' }, { char: '🔈', name: 'speaker low volume' }, { char: '🔇', name: 'muted speaker' }, { char: '🔉', name: 'speaker medium volume' }, { char: '🔊', name: 'speaker high volume' }, { char: '🔔', name: 'bell' }, { char: '🔕', name: 'bell with slash' }, { char: '📣', name: 'megaphone' }, { char: '📢', name: 'loudspeaker' }, { char: '👁️‍🗨️', name: 'eye in speech bubble' }, { char: '💬', name: 'speech balloon' }, { char: '💭', name: 'thought balloon' }, { char: '🗯️', name: 'right anger bubble' }, { char: '♠️', name: 'spade suit' }, { char: '♣️', name: 'club suit' }, { char: '♥️', name: 'heart suit' }, { char: '♦️', name: 'diamond suit' }, { char: '🃏', name: 'joker' }, { char: '🎴', name: 'flower playing cards' }, { char: '🀄️', name: 'mahjong red dragon' }, { char: '🕐', name: 'one o’clock' }, { char: '🕑', name: 'two o’clock' }, { char: '🕒', name: 'three o’clock' }, { char: '🕓', name: 'four o’clock' }, { char: '🕔', name: 'five o’clock' }, { char: '🕕', name: 'six o’clock' }, { char: '🕖', name: 'seven o’clock' }, { char: '🕗', name: 'eight o’clock' }, { char: '🕘', name: 'nine o’clock' }, { char: '🕙', name: 'ten o’clock' }, { char: '🕚', name: 'eleven o’clock' }, { char: '🕛', name: 'twelve o’clock' }, { char: '🕜', name: 'one-thirty' }, { char: '🕝', name: 'two-thirty' }, { char: '🕞', name: 'three-thirty' }, { char: '🕟', name: 'four-thirty' }, { char: '🕠', name: 'five-thirty' }, { char: '🕡', name: 'six-thirty' }, { char: '🕢', name: 'seven-thirty' }, { char: '🕣', name: 'eight-thirty' }, { char: '🕤', name: 'nine-thirty' }, { char: '🕥', name: 'ten-thirty' }, { char: '🕦', name: 'eleven-thirty' }, { char: '🕧', name: 'twelve-thirty' },
  ],
};

export function EmojiLibrary({ onEmojiSelect }: EmojiLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const allEmojis = Object.values(emojiCategories).flat();

  const searchResults = searchTerm
    ? allEmojis.filter(emoji =>
        emoji.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emoji.char.includes(searchTerm)
      )
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <Input
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <Tabs defaultValue="Smileys & People" className="flex-1 flex flex-col">
          {!searchTerm && (
            <TabsList className="flex flex-wrap h-auto">
              {Object.keys(emojiCategories).map(cat => (
                <TabsTrigger key={cat} value={cat}>{cat.split(' ')[0]}</TabsTrigger>
              ))}
            </TabsList>
          )}

          {searchTerm ? (
             <div className="p-4 grid grid-cols-8 gap-2">
              {searchResults.map((emoji) => (
                <div
                  key={emoji.char}
                  className="cursor-pointer text-2xl flex items-center justify-center aspect-square rounded-md hover:bg-accent"
                  onClick={() => onEmojiSelect(emoji.char)}
                  title={emoji.name}
                >
                  {emoji.char}
                </div>
              ))}
            </div>
          ) : (
            Object.entries(emojiCategories).map(([category, emojis]) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="p-4 grid grid-cols-8 gap-2">
                  {emojis.map((emoji) => (
                    <div
                      key={emoji.char}
                      className="cursor-pointer text-2xl flex items-center justify-center aspect-square rounded-md hover:bg-accent"
                      onClick={() => onEmojiSelect(emoji.char)}
                      title={emoji.name}
                    >
                      {emoji.char}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))
          )}
        </Tabs>
      </ScrollArea>
    </div>
  );
}
