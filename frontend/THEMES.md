# 🎨 Система тем InternAI

## Обзор
Приложение InternAI поддерживает светлую и темную темы с плавными переходами и сохранением предпочтений пользователя.

## Цветовая схема

### 🌞 Светлая тема
- **Background:** `#FAFAFA`
- **Secondary Background:** `#EFEFEF`
- **Accent:** `#C700FF`
- **Text:** `#121212` / `#2B2B2B`

### 🌙 Темная тема
- **Background:** `#080808`
- **Secondary Background:** `#151515`
- **Accent:** `#C700FF`
- **Text:** `#F0F0F0` / `#B0B0B0`

## Использование

### Переключатель тем
- 📍 **Расположение:** Правый верхний угол навбара
- 🎯 **Функционал:** Мгновенное переключение между темами
- 💾 **Сохранение:** Автоматически сохраняется в localStorage
- 🔄 **Синхронизация:** Поддерживает системные настройки

### CSS классы
```css
/* Основные цвета */
.bg-theme-primary     /* Основной фон */
.bg-theme-secondary   /* Вторичный фон */
.bg-theme-accent      /* Акцентный цвет */
.text-theme-primary   /* Основной текст */
.text-theme-secondary /* Вторичный текст */
.border-theme         /* Границы */

/* CSS переменные */
var(--bg-primary)
var(--bg-secondary)
var(--text-primary)
var(--accent)
```

### Компоненты с поддержкой тем
- ✅ Navbar (навигация)
- ✅ InteractiveRoadmap (интерактивная карта)
- ✅ WeekNode (узлы недель)
- ✅ HeroSection (главная секция)
- ✅ MyRoadmapPage (страница дорожной карты)
- ✅ AuthModal (модальные окна)

## Архитектура

### ThemeContext
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
```

### Хук useTheme
```typescript
const { theme, toggleTheme } = useTheme();
```

### ThemeToggle компонент
Элегантный переключатель с иконками солнца и луны, анимациями и визуальной обратной связью.

## Особенности

### 🎭 Автоматическое определение
- Проверяет localStorage
- Следует системным настройкам
- Плавные переходы (300ms)

### 🎨 Визуальные эффекты
- Анимированный переключатель
- Градиенты с акцентным цветом
- Backdrop blur эффекты
- Состояния hover/focus

### 📱 Адаптивность
- Работает на всех устройствах
- Мобильная и десктопная версии
- Поддержка touch-устройств

## Примеры использования

### Компонент с темой
```typescript
const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <div className="bg-theme-primary text-theme-primary transition-colors duration-300">
      <h1 className="text-theme-accent">Заголовок</h1>
      <p className="text-theme-secondary">Описание</p>
    </div>
  );
};
```

### Условные стили
```typescript
<button className={`
  px-4 py-2 rounded-lg transition-all duration-200
  ${theme === 'dark' 
    ? 'bg-theme-accent text-white' 
    : 'bg-theme-secondary text-theme-primary'
  }
`}>
  Кнопка
</button>
```

## Лучшие практики

1.  **Всегда используйте transition-colors** для плавных переходов
2.  **Тестируйте в обеих темах** при разработке новых компонентов
3.  **Используйте CSS переменные** для сложной логики (например, если Tailwind не может обработать динамические цвета напрямую)
4.  **Избегайте `!important` в инлайн-стилях для цветов текста/фона**: Это может привести к конфликтам с Tailwind и помешать динамическому изменению темы. Предпочитайте утилитарные классы Tailwind (`text-theme-primary`, `bg-theme-secondary`) или, если необходимо, настройте Tailwind JIT для работы с динамическими значениями без `!important`.
5.  **Сохраняйте контрастность** для доступности
6.  **Добавляйте hover состояния** с учетом темы

## Файловая структура
```
src/
├── contexts/ThemeContext.tsx    # Контекст тем
├── components/ThemeToggle.tsx   # Переключатель
├── index.css                    # CSS переменные
└── components/                  # Компоненты с поддержкой тем
```

---

✨ **Результат:** Современная, отзывчивая система тем с плавными переходами и отличным UX! 