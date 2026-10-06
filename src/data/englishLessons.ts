import type { EnglishLesson, EnglishWord } from '../types'

// Daily English Time lessons for a young Tamil-speaking learner who already
// knows basic nouns (apple, ball, cat…). Each lesson adds 4 words beyond that
// level — feelings, actions, describing words, places, routines — plus a
// sentence frame to speak and a tiny story about Sparkle that reuses the words.
//
// `ta` is the everyday spoken Tamil a parent would use, not textbook Tamil.
// Emoji are limited to ones that render on Android 10+ (Emoji ≤ 12).
// Stories avoid em dashes, interjections and quoted back-and-forth because the
// text-to-speech voice reads them awkwardly.
//
// Progress stores lesson *indexes*, so append new lessons at the end rather
// than reordering existing ones. After the last lesson the app wraps around.

function w(id: string, en: string, ta: string, emoji: string, example: string): EnglishWord {
  return { id, en, ta, emoji, example }
}

export const ENGLISH_LESSONS: EnglishLesson[] = [
  {
    id: 'feelings-1', title: 'How I Feel', emoji: '😊',
    words: [
      w('happy',  'happy',  'சந்தோஷம்', '😊', 'I am happy.'),
      w('sad',    'sad',    'சோகம்',    '😢', 'The baby is sad.'),
      w('angry',  'angry',  'கோபம்',    '😠', 'Do not be angry.'),
      w('scared', 'scared', 'பயம்',     '😨', 'I am scared of the dark.'),
    ],
    talk: { question: 'How do you feel today?', starter: 'I feel ___.', example: 'I feel happy.' },
    story: [
      'Sparkle wakes up. She feels happy.',
      'Her balloon goes pop! Sparkle is scared.',
      'A monkey takes her crown. Sparkle is angry, and then sad.',
      'Mama unicorn gives her a hug. Sparkle is happy again!',
    ],
  },
  {
    id: 'body-needs', title: 'Hungry and Sleepy', emoji: '🍽️',
    words: [
      w('hungry',  'hungry',  'பசி',           '🍽️', 'I am hungry.'),
      w('thirsty', 'thirsty', 'தாகம்',         '🥤', 'I am thirsty. I want water.'),
      w('tired',   'tired',   'களைப்பு',       '😫', 'After play, I am tired.'),
      w('sleepy',  'sleepy',  'தூக்கம் வருது', '🥱', 'The baby is sleepy.'),
    ],
    talk: { question: 'Are you hungry or thirsty?', starter: 'I am ___.', example: 'I am thirsty!' },
    story: [
      'Sparkle plays all day.',
      'She is hungry, so she eats a dosa.',
      'She is thirsty, so she drinks water.',
      'Now she is tired and sleepy. Good night!',
    ],
  },
  {
    id: 'actions-1', title: 'Move Your Body', emoji: '🏃',
    words: [
      w('run',  'run',  'ஓடு',     '🏃', 'I can run fast.'),
      w('jump', 'jump', 'குதி',    '🐸', 'The frog can jump.'),
      w('walk', 'walk', 'நட',      '🚶', 'We walk to the park.'),
      w('sit',  'sit',  'உட்கார்', '🪑', 'Please sit down.'),
    ],
    talk: { question: 'What can you do?', starter: 'I can ___.', example: 'I can jump.' },
    story: [
      'Sparkle goes to the park.',
      'She can run. She can jump!',
      'Then she walks slowly.',
      'She sits under a tree and smiles.',
    ],
  },
  {
    id: 'opposites-1', title: 'Big and Small', emoji: '🐘',
    words: [
      w('big',   'big',   'பெரிய',          '🐘', 'The elephant is big.'),
      w('small', 'small', 'சின்ன',          '🐭', 'The mouse is small.'),
      w('hot',   'hot',   'சூடு',           '🔥', 'The tea is hot.'),
      w('cold',  'cold',  'ஜில்லுனு / குளிர்', '🧊', 'The ice is cold.'),
    ],
    talk: { question: 'Tell me something big!', starter: 'The ___ is big.', example: 'The elephant is big.' },
    story: [
      'Sparkle sees a big elephant and a small mouse.',
      'The elephant drinks cold water.',
      'The mouse drinks hot milk.',
      'Big friend and small friend play together!',
    ],
  },
  {
    id: 'places-1', title: 'Where Is It?', emoji: '📦',
    words: [
      w('in',      'in',      'உள்ளே',      '📦', 'The cat is in the box.'),
      w('on',      'on',      'மேலே',       '📚', 'The book is on the table.'),
      w('under',   'under',   'அடியில்',    '🛏️', 'The ball is under the bed.'),
      w('next-to', 'next to', 'பக்கத்தில்', '👭', 'I sit next to Amma.'),
    ],
    talk: { question: 'Where is your school bag?', starter: 'My bag is ___ the ___.', example: 'My bag is on the chair.' },
    story: [
      'Sparkle lost her crown!',
      'Is it in the box? No.',
      'Is it under the bed? No. Is it next to the lamp? No.',
      'It is on her head! Silly Sparkle!',
    ],
  },
  {
    id: 'polite-1', title: 'Magic Words', emoji: '🙏',
    words: [
      w('please',    'please',    'தயவுசெய்து',        '🙏', 'Water, please.'),
      w('thank-you', 'thank you', 'நன்றி',             '💐', 'Thank you, Appa!'),
      w('sorry',     'sorry',     'மன்னிச்சிடு',       '😔', 'I am sorry.'),
      w('excuse-me', 'excuse me', 'கொஞ்சம் வழி விடுங்க', '🙋', 'Excuse me, can I come in?'),
    ],
    talk: { question: 'What do you say when someone gives you a gift?', starter: 'I say ___.', example: 'I say thank you!' },
    story: [
      'A rabbit is in the way. Sparkle says, "Excuse me, please."',
      'Sparkle asks, "Can I have a carrot, please?"',
      'The rabbit gives her a carrot. Sparkle says, "Thank you!"',
      'Oops, she steps on his foot. Sparkle says, "Sorry!"',
    ],
  },
  {
    id: 'morning', title: 'Good Morning', emoji: '⏰',
    words: [
      w('wake-up', 'wake up', 'எழுந்திரு',   '⏰', 'I wake up early.'),
      w('wash',    'wash',    'கழுவு',       '🧼', 'Wash your face.'),
      w('brush',   'brush',   'பல் விளக்கு', '🦷', 'I brush my teeth.'),
      w('comb',    'comb',    'தலை சீவு',    '💇', 'I comb my hair.'),
    ],
    talk: { question: 'What do you do in the morning?', starter: 'In the morning, I ___.', example: 'In the morning, I brush my teeth.' },
    story: [
      'The sun is up. Sparkle wakes up.',
      'She washes her face.',
      'She brushes her teeth.',
      'She combs her rainbow hair. Ready!',
    ],
  },
  {
    id: 'bedtime', title: 'Bedtime', emoji: '🛏️',
    words: [
      w('bath',    'bath',    'குளியல்', '🛁', 'I take a bath.'),
      w('blanket', 'blanket', 'போர்வை',  '🛌', 'I sleep under my blanket.'),
      w('story',   'story',   'கதை',     '📖', 'Read me a story, please.'),
      w('dream',   'dream',   'கனவு',    '💭', 'I dream about stars.'),
    ],
    talk: { question: 'What do you do before bed?', starter: 'Before bed, I ___.', example: 'Before bed, I read a story.' },
    story: [
      'It is night. Sparkle takes a warm bath.',
      'She gets under her soft blanket.',
      'Papa unicorn reads her a story.',
      'She dreams about flying over the rainbow.',
    ],
  },
  {
    id: 'actions-2', title: 'Clap and Kick', emoji: '👏',
    words: [
      w('clap', 'clap', 'கை தட்டு', '👏', 'Clap your hands!'),
      w('kick', 'kick', 'உதை',      '⚽', 'Kick the ball.'),
      w('push', 'push', 'தள்ளு',    '🛒', 'Push the cart.'),
      w('pull', 'pull', 'இழு',      '🧲', 'Pull the rope.'),
    ],
    talk: { question: 'Can you clap your hands?', starter: 'Yes, I can ___ my hands.', example: 'Yes, I can clap my hands.' },
    story: [
      'Sparkle kicks the ball. Goal!',
      'All her friends clap.',
      'Now they pull a big rope.',
      'Then they push the swing. Push, pull, what fun!',
    ],
  },
  {
    id: 'weather', title: 'The Weather', emoji: '🌦️',
    words: [
      w('sunny',  'sunny',  'வெயில்', '☀️', 'It is sunny today.'),
      w('rainy',  'rainy',  'மழை',    '🌧️', 'It is rainy. Take an umbrella.'),
      w('windy',  'windy',  'காற்று',  '🌬️', 'It is windy. My kite flies!'),
      w('cloudy', 'cloudy', 'மேகம்',  '☁️', 'The sky is cloudy.'),
    ],
    talk: { question: 'How is the weather today?', starter: 'It is ___ today.', example: 'It is sunny today.' },
    story: [
      'In the morning it is sunny. Sparkle plays outside.',
      'Then it is cloudy.',
      'Then it is windy. Whoosh!',
      'Now it is rainy. Sparkle jumps in the puddles!',
    ],
  },
  {
    id: 'kitchen', title: 'In the Kitchen', emoji: '🍳',
    words: [
      w('cook', 'cook', 'சமை',    '🍳', 'Amma cooks rice.'),
      w('cut',  'cut',  'வெட்டு', '🔪', 'Appa cuts the onion.'),
      w('pour', 'pour', 'ஊற்று',  '🥛', 'Pour the milk.'),
      w('mix',  'mix',  'கலக்கு', '🥣', 'Mix the rice and curd.'),
    ],
    talk: { question: 'What is Amma cooking today?', starter: 'Amma is cooking ___.', example: 'Amma is cooking dosa.' },
    story: [
      'Sparkle wants to make a cake.',
      'She pours milk into a bowl.',
      'She mixes and mixes.',
      'Mama cooks it. Sparkle cuts a big piece for you. Yum!',
    ],
  },
  {
    id: 'opposites-2', title: 'Fast and Slow', emoji: '🐢',
    words: [
      w('fast',  'fast',  'வேகமா',   '🐎', 'The horse runs fast.'),
      w('slow',  'slow',  'மெதுவா',  '🐢', 'The tortoise is slow.'),
      w('loud',  'loud',  'சத்தமா',  '📢', 'The drum is loud.'),
      w('quiet', 'quiet', 'அமைதியா', '🤫', 'Be quiet, the baby is sleeping.'),
    ],
    talk: { question: 'Which animal is fast?', starter: 'A ___ is fast.', example: 'A rabbit is fast.' },
    story: [
      'Sparkle and Tortoise have a race.',
      'Sparkle is fast. Tortoise is slow.',
      'The crowd is loud. Go, go, go!',
      'Sparkle stops for a nap. It is quiet. Tortoise wins!',
    ],
  },
  {
    id: 'family', title: 'My Family', emoji: '👨‍👩‍👧',
    words: [
      w('grandmother', 'grandmother', 'பாட்டி',         '👵', 'My grandmother tells stories.'),
      w('grandfather', 'grandfather', 'தாத்தா',         '👴', 'My grandfather reads the paper.'),
      w('brother',     'brother',     'அண்ணன் / தம்பி', '👦', 'My brother plays cricket.'),
      w('sister',      'sister',      'அக்கா / தங்கை',  '👧', 'My sister sings.'),
    ],
    talk: { question: 'Who do you live with?', starter: 'I live with ___.', example: 'I live with Amma, Appa and Paati.' },
    story: [
      'Sparkle visits her grandmother and grandfather.',
      'Grandmother makes sweets.',
      'Grandfather tells a funny story.',
      'Her brother and sister laugh and laugh!',
    ],
  },
  {
    id: 'play', title: 'Playtime', emoji: '🧸',
    words: [
      w('play',  'play',  'விளையாடு',   '🧸', "Let's play!"),
      w('throw', 'throw', 'எறி',        '🤾', 'Throw the ball to me.'),
      w('catch', 'catch', 'பிடி',       '🥎', 'I can catch the ball.'),
      w('hide',  'hide',  'ஒளிஞ்சுக்கோ', '🙈', 'Hide behind the door!'),
    ],
    talk: { question: 'What do you like to play?', starter: 'I like to play ___.', example: 'I like to play hide and seek.' },
    story: [
      'Sparkle and Bunny play ball.',
      'Sparkle throws. Bunny catches!',
      'Now they play hide and seek.',
      'Bunny hides behind a tree. Found you!',
    ],
  },
  {
    id: 'shapes', title: 'Shapes', emoji: '🔺',
    words: [
      w('circle',   'circle',   'வட்டம்',    '⭕', 'The clock is a circle.'),
      w('square',   'square',   'சதுரம்',    '🟥', 'The window is a square.'),
      w('triangle', 'triangle', 'முக்கோணம்', '🔺', 'The hat is a triangle.'),
      w('heart',    'heart',    'இதயம்',     '❤️', 'I draw a heart for Amma.'),
    ],
    talk: { question: 'Find a circle in your room!', starter: 'The ___ is a circle.', example: 'The plate is a circle.' },
    story: [
      'Sparkle draws a big circle. That is the sun.',
      'She draws a square. That is a house.',
      'A triangle on top. That is the roof!',
      'And a red heart for Mama. Beautiful!',
    ],
  },
  {
    id: 'animals-do', title: 'What Animals Do', emoji: '🐦',
    words: [
      w('bark',  'bark',  'குரைக்கும்', '🐕', 'The dog barks.'),
      w('fly',   'fly',   'பறக்கும்',   '🐦', 'Birds fly high.'),
      w('swim',  'swim',  'நீந்தும்',   '🐟', 'Fish swim in water.'),
      w('climb', 'climb', 'ஏறும்',      '🐒', 'The monkey climbs the tree.'),
    ],
    talk: { question: 'What can a bird do?', starter: 'A bird can ___.', example: 'A bird can fly.' },
    story: [
      'At the zoo, the monkey climbs.',
      'The fish swim. The birds fly.',
      'A little dog barks. Woof!',
      'Sparkle says, "I can fly too!"',
    ],
  },
  {
    id: 'tidy', title: 'Tidy Up', emoji: '🧺',
    words: [
      w('open',     'open',     'திற',        '📖', 'Open your book.'),
      w('close',    'close',    'மூடு',       '🚪', 'Close the door, please.'),
      w('pick-up',  'pick up',  'எடு',        '🧸', 'Pick up your toys.'),
      w('put-away', 'put away', 'எடுத்து வை', '🧺', 'Put away your shoes.'),
    ],
    talk: { question: 'How do you help tidy your room?', starter: 'I ___ my toys.', example: 'I pick up my toys.' },
    story: [
      "Sparkle's room is messy!",
      'She picks up her toys.',
      'She opens the box and puts them away.',
      'She closes the box. All clean! Mama is happy.',
    ],
  },
  {
    id: 'questions', title: 'Asking Questions', emoji: '❓',
    words: [
      w('what',  'what',  'என்ன',  '❓', 'What is this?'),
      w('where', 'where', 'எங்கே', '🔍', 'Where is my shoe?'),
      w('who',   'who',   'யார்',  '👤', 'Who is at the door?'),
      w('why',   'why',   'ஏன்',   '🤔', 'Why is the sky blue?'),
    ],
    talk: { question: 'Now you ask me a question!', starter: 'What is ___?', example: 'What is your name?' },
    story: [
      'Knock, knock! Sparkle asks, "Who is there?"',
      'Owl asks, "What is in your bag?"',
      'Sparkle says, "Cookies for you! Where is your plate?"',
      'Owl asks, "Why are you so kind?" Sparkle says, "Because you are my friend!"',
    ],
  },
  {
    id: 'times', title: 'Morning to Night', emoji: '🌙',
    words: [
      w('morning',   'morning',   'காலை',   '🌅', 'I go to school in the morning.'),
      w('afternoon', 'afternoon', 'மதியம்', '🌞', 'We eat lunch in the afternoon.'),
      w('evening',   'evening',   'மாலை',   '🌇', 'I play in the evening.'),
      w('night',     'night',     'இரவு',   '🌙', 'I sleep at night.'),
    ],
    talk: { question: 'When do you play?', starter: 'I play in the ___.', example: 'I play in the evening.' },
    story: [
      'In the morning, Sparkle goes to school.',
      'In the afternoon, she eats lunch.',
      'In the evening, she plays with friends.',
      'At night, she looks at the moon and sleeps.',
    ],
  },
  {
    id: 'school', title: 'At School', emoji: '🏫',
    words: [
      w('teacher', 'teacher', 'டீச்சர் (ஆசிரியர்)', '👩‍🏫', 'My teacher is kind.'),
      w('friend',  'friend',  'நண்பன் / தோழி',     '👭', 'She is my best friend.'),
      w('class',   'class',   'வகுப்பு',            '🏫', 'My class is big.'),
      w('learn',   'learn',   'கத்துக்கோ',          '📝', 'I learn new words.'),
    ],
    talk: { question: 'Who is your best friend?', starter: 'My best friend is ___.', example: 'My best friend is Diya.' },
    story: [
      'Sparkle goes to class.',
      'Her teacher says, "Good morning!"',
      'Sparkle sits next to her friend.',
      'Today they learn to count to twenty!',
    ],
  },
  {
    id: 'feelings-2', title: 'Big Feelings', emoji: '🤩',
    words: [
      w('excited',   'excited',   'உற்சாகம்',  '🤩', 'I am excited for my birthday!'),
      w('proud',     'proud',     'பெருமை',    '🏅', 'Amma is proud of me.'),
      w('shy',       'shy',       'வெட்கம்',   '☺️', 'The new girl is shy.'),
      w('surprised', 'surprised', 'ஆச்சரியம்', '😮', 'I am surprised to see a gift!'),
    ],
    talk: { question: 'When do you feel proud?', starter: 'I feel proud when I ___.', example: 'I feel proud when I help Amma.' },
    story: [
      'Today is the school show. Sparkle is excited!',
      'On the stage, she feels shy.',
      'She sings her song. Everyone claps!',
      'Sparkle is surprised. Mama is so proud!',
    ],
  },
  {
    id: 'garden', title: 'Growing Things', emoji: '🌱',
    words: [
      w('plant', 'plant', 'நடு',          '👩‍🌾', 'I plant a seed.'),
      w('water', 'water', 'தண்ணி ஊத்து',  '💦', 'Water the plant every day.'),
      w('grow',  'grow',  'வளரு',         '🌱', 'The plant grows tall.'),
      w('leaf',  'leaf',  'இலை',          '🍃', 'The leaf is green.'),
    ],
    talk: { question: 'What can you see outside?', starter: 'I can see a ___.', example: 'I can see a big tree.' },
    story: [
      'Sparkle plants a small seed.',
      'She waters it every day.',
      'It grows and grows. Look, a green leaf!',
      'Then a pink flower! Sparkle is so happy.',
    ],
  },
  {
    id: 'helping', title: 'Helping Hands', emoji: '🤝',
    words: [
      w('help',  'help',  'உதவி செய்',      '🤝', 'I help Amma.'),
      w('give',  'give',  'கொடு',           '🤲', 'Give me the pencil, please.'),
      w('share', 'share', 'பகிர்ந்து கொடு', '🍪', 'I share my snack.'),
      w('wait',  'wait',  'காத்திரு',       '⏳', 'Wait for your turn.'),
    ],
    talk: { question: 'How do you help at home?', starter: 'I help Amma ___.', example: 'I help Amma set the plates.' },
    story: [
      'Bunny has no snack. He is sad.',
      'Sparkle shares her cookie.',
      'Bunny waits for his turn on the swing.',
      'Then he gives Sparkle a flower. Friends help friends!',
    ],
  },
  {
    id: 'sizes', title: 'Tall and Long', emoji: '🦒',
    words: [
      w('tall',  'tall',  'உயரம்',  '🦒', 'The giraffe is tall.'),
      w('short', 'short', 'குட்டை', '🐧', 'The penguin is short.'),
      w('long',  'long',  'நீளம்',  '🐍', 'The snake is long.'),
      w('heavy', 'heavy', 'கனம்',   '🏋️', 'This bag is heavy.'),
    ],
    talk: { question: 'Who is tall in your family?', starter: '___ is tall.', example: 'Appa is tall.' },
    story: [
      'Giraffe is tall. Penguin is short.',
      'Snake is long, long, long!',
      'They want to lift a heavy box.',
      'Together they can do it! Hooray!',
    ],
  },
  {
    id: 'senses', title: 'My Senses', emoji: '👀',
    words: [
      w('see',   'see',   'பார்',       '👀', 'I see a bird.'),
      w('hear',  'hear',  'கேள்',       '👂', 'I hear music.'),
      w('smell', 'smell', 'மோந்து பார்', '👃', 'I smell the flowers.'),
      w('taste', 'taste', 'ருசி பார்',  '👅', 'Taste the mango!'),
    ],
    talk: { question: 'What can you hear right now?', starter: 'I can hear ___.', example: 'I can hear a bird.' },
    story: [
      'Sparkle goes to the market.',
      'She sees red tomatoes.',
      'She hears the bell. She smells jasmine flowers.',
      'She tastes a sweet mango. Yum!',
    ],
  },
  {
    id: 'going-out', title: 'Going Out', emoji: '🚌',
    words: [
      w('shop',   'shop',   'கடை',    '🛒', 'We buy fruit at the shop.'),
      w('park',   'park',   'பூங்கா', '🎠', 'I play in the park.'),
      w('temple', 'temple', 'கோவில்', '🛕', 'We go to the temple.'),
      w('bus',    'bus',    'பஸ்',    '🚌', 'We go by bus.'),
    ],
    talk: { question: 'Where do you like to go?', starter: 'I like to go to the ___.', example: 'I like to go to the park.' },
    story: [
      'Sparkle is excited. She gets on the bus.',
      'First, she goes to the temple with Grandmother.',
      'Then they go to the shop for bananas.',
      'Last stop is the park! She goes down the slide. She is tired and happy.',
    ],
  },
  {
    id: 'days', title: 'Yesterday and Tomorrow', emoji: '📅',
    words: [
      w('today',     'today',     'இன்று',  '📅', 'Today is a happy day.'),
      w('tomorrow',  'tomorrow',  'நாளை',   '⏭️', 'Tomorrow we go to the park.'),
      w('yesterday', 'yesterday', 'நேற்று', '⏮️', 'Yesterday it was rainy.'),
      w('week',      'week',      'வாரம்',  '🗓️', 'A week has seven days.'),
    ],
    talk: { question: 'What day is today?', starter: 'Today is ___.', example: 'Today is Monday.' },
    story: [
      'Yesterday, Sparkle painted a picture.',
      'Today, she is making laddoos.',
      'Tomorrow, she will visit Grandmother.',
      'What a busy week!',
    ],
  },
  {
    id: 'tastes', title: 'Sweet and Spicy', emoji: '🌶️',
    words: [
      w('sweet', 'sweet', 'இனிப்பு',  '🍬', 'Payasam is sweet.'),
      w('spicy', 'spicy', 'காரம்',    '🌶️', 'The chutney is spicy.'),
      w('sour',  'sour',  'புளிப்பு', '🍋', 'The lemon is sour.'),
      w('salty', 'salty', 'உப்பு',    '🧂', 'The chips are salty.'),
    ],
    talk: { question: 'What food is sweet?', starter: '___ is sweet.', example: 'Mango is sweet.' },
    story: [
      'Sparkle tries a lemon. Sour! She makes a funny face.',
      'She tries the chutney. Spicy! Water, please!',
      'She tries the chips. Salty.',
      'Then payasam. Sweet! Her favourite!',
    ],
  },
  {
    id: 'how-many', title: 'Many and Few', emoji: '🔢',
    words: [
      w('many', 'many', 'நிறைய',   '✨', 'There are many stars.'),
      w('few',  'few',  'கொஞ்சம்', '🤏', 'I have a few sweets.'),
      w('all',  'all',  'எல்லாம்', '💯', 'All the children are here.'),
      w('more', 'more', 'இன்னும்', '➕', 'More rice, please!'),
    ],
    talk: { question: 'How many toys do you have?', starter: 'I have ___ toys.', example: 'I have many toys.' },
    story: [
      'Sparkle has many sweets in a jar.',
      'She shares a few with Bunny and a few with Owl.',
      'Oh no, they are all gone!',
      'Mama says, "Here are some more!"',
    ],
  },
  {
    id: 'party', title: 'Party Time', emoji: '🎂',
    words: [
      w('birthday', 'birthday', 'பிறந்தநாள்', '🎂', 'Happy birthday to you!'),
      w('gift',     'gift',     'பரிசு',      '🎁', 'This gift is for you.'),
      w('dance',    'dance',    'டான்ஸ் ஆடு', '💃', "Let's dance!"),
      w('sing',     'sing',     'பாடு',       '🎤', 'I sing a song.'),
    ],
    talk: { question: 'What do you do on your birthday?', starter: 'On my birthday, I ___.', example: 'On my birthday, I cut a cake.' },
    story: [
      "Today is Sparkle's birthday! She is so excited.",
      'Her friends bring a big gift.',
      'Everyone sings Happy Birthday.',
      'Then they all dance under the rainbow!',
    ],
  },
]
