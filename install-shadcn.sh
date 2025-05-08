#!/bin/bash

# Initialize shadcn/ui
npx shadcn@latest init

# Install all components
components=(
  "accordion"
  "alert"
  "alert-dialog"
  "aspect-ratio"
  "avatar"
  "badge"
  "breadcrumb"
  "button"
  "calendar"
  "card"
  "carousel"
  "checkbox"
  "collapsible"
  "combobox"
  "command"
  "context-menu"
  "data-table"
  "date-picker"
  "dialog"
  "drawer"
  "dropdown-menu"
  "form"
  "hover-card"
  "input"
  "input-otp"
  "label"
  "menubar"
  "navigation-menu"
  "pagination"
  "popover"
  "progress"
  "radio-group"
  "resizable"
  "scroll-area"
  "select"
  "separator"
  "sheet"
  "sidebar"
  "skeleton"
  "slider"
  "sonner"
  "switch"
  "table"
  "tabs"
  "textarea"
  "toast"
  "toggle"
  "toggle-group"
  "tooltip"
)

for component in "${components[@]}"
do
  echo "Installing $component..."
  npx shadcn@latest add $component
done

echo "All components installed successfully!"

