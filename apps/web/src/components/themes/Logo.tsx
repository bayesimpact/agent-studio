import { defaultTheme } from "./helpers"

export function Logo() {
  const themeColor = defaultTheme === "blue" ? "#7ABECC" : "#f18c6e"

  const logoUrl = import.meta.env.VITE_LOGO_URL as string | undefined

  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" className="max-h-10 w-auto" />
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410.85 405.35">
      <title>Connect</title>
      <g id="Calque_2" data-name="Calque 2">
        <g id="Calque_1-2" data-name="Calque 1">
          <path
            fill={themeColor}
            d="M366.77,161.43H247V41.61a41.37,41.37,0,1,0-82.74,0V161.43H44.39a41.37,41.37,0,0,0,0,82.74H164.21V364A41.37,41.37,0,1,0,247,364V244.17H366.77a41.37,41.37,0,1,0,0-82.74Z"
          />
          <circle fill="#010101" cx="205.58" cy="364.27" r="41.05" />
          <circle fill="#010101" cx="369.79" cy="202.64" r="41.05" />
          <circle fill="#010101" cx="41.05" cy="202.64" r="41.05" />
          <circle fill="#010101" cx="205.58" cy="41.05" r="41.05" />
          <circle fill="#010101" cx="205.58" cy="202.64" r="41.05" />
        </g>
      </g>
    </svg>
  )
}
