# Original Rive sources

Place runtime exports in this directory. The application discovers them at build time and only loads the Rive runtime when a matching file exists.

Required original exports:

- `mascot-guide.riv`, state machine `MascotGuide`, triggers `idle`, `listen`, `success`, `retry`, `wave`, `celebrate`.
- `brand-intro.riv`, state machine `BrandIntro`, trigger `wave`.
- `answer-feedback.riv`, state machine `AnswerFeedback`, triggers `correct`, `retry`.
- `reward-stars.riv`, state machine `RewardStars`, numeric input `stars`, trigger `reveal`.

The editable Rive projects and export notes must remain with the project owner. Do not add Marketplace files or third-party rigs here.
