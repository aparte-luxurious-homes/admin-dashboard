export function BellIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            {...rest}
            fill="none"
            className={`h-auto ${className}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M9.01494 2.18359C6.53244 2.18359 4.51494 4.20109 4.51494 6.68359V8.85109C4.51494 9.30859 4.31994 10.0061 4.08744 10.3961L3.22494 11.8286C2.69244 12.7136 3.05994 13.6961 4.03494 14.0261C7.26744 15.1061 10.7549 15.1061 13.9874 14.0261C14.8949 13.7261 15.2924 12.6536 14.7974 11.8286L13.9349 10.3961C13.7099 10.0061 13.5149 9.30859 13.5149 8.85109V6.68359C13.5149 4.20859 11.4899 2.18359 9.01494 2.18359Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" />
            <path d="M10.402 2.40203C10.1695 2.33453 9.92945 2.28203 9.68195 2.25203C8.96195 2.16203 8.27195 2.21453 7.62695 2.40203C7.84445 1.84703 8.38445 1.45703 9.01445 1.45703C9.64445 1.45703 10.1845 1.84703 10.402 2.40203Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.2646 14.293C11.2646 15.5305 10.2521 16.543 9.01465 16.543C8.39965 16.543 7.82965 16.288 7.42465 15.883C7.01965 15.478 6.76465 14.908 6.76465 14.293" stroke={color} strokeMiterlimit="10" />
        </svg>
    );
};


export function SettingsIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.5 9.66105V8.34105C1.5 7.56105 2.1375 6.91605 2.925 6.91605C4.2825 6.91605 4.8375 5.95605 4.155 4.77855C3.765 4.10355 3.9975 3.22605 4.68 2.83605L5.9775 2.09355C6.57 1.74105 7.335 1.95105 7.6875 2.54355L7.77 2.68605C8.445 3.86355 9.555 3.86355 10.2375 2.68605L10.32 2.54355C10.6725 1.95105 11.4375 1.74105 12.03 2.09355L13.3275 2.83605C14.01 3.22605 14.2425 4.10355 13.8525 4.77855C13.17 5.95605 13.725 6.91605 15.0825 6.91605C15.8625 6.91605 16.5075 7.55355 16.5075 8.34105V9.66105C16.5075 10.4411 15.87 11.0861 15.0825 11.0861C13.725 11.0861 13.17 12.0461 13.8525 13.2236C14.2425 13.9061 14.01 14.7761 13.3275 15.1661L12.03 15.9086C11.4375 16.2611 10.6725 16.0511 10.32 15.4586L10.2375 15.3161C9.5625 14.1386 8.4525 14.1386 7.77 15.3161L7.6875 15.4586C7.335 16.0511 6.57 16.2611 5.9775 15.9086L4.68 15.1661C3.9975 14.7761 3.765 13.8986 4.155 13.2236C4.8375 12.0461 4.2825 11.0861 2.925 11.0861C2.1375 11.0861 1.5 10.4411 1.5 9.66105Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    );
};

export function UsersIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M13.4996 5.37C13.4546 5.3625 13.4021 5.3625 13.3571 5.37C12.3221 5.3325 11.4971 4.485 11.4971 3.435C11.4971 2.3625 12.3596 1.5 13.4321 1.5C14.5046 1.5 15.3671 2.37 15.3671 3.435C15.3596 4.485 14.5346 5.3325 13.4996 5.37Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.7276 10.8301C13.7551 11.0026 14.8876 10.8226 15.6826 10.2901C16.7401 9.58512 16.7401 8.43012 15.6826 7.72512C14.8801 7.19262 13.7326 7.01262 12.7051 7.19262" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.47785 5.37C4.52285 5.3625 4.57535 5.3625 4.62035 5.37C5.65535 5.3325 6.48035 4.485 6.48035 3.435C6.48035 2.3625 5.61785 1.5 4.54535 1.5C3.47285 1.5 2.61035 2.37 2.61035 3.435C2.61785 4.485 3.44285 5.3325 4.47785 5.37Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.25008 10.8301C4.22258 11.0026 3.09008 10.8226 2.29508 10.2901C1.23758 9.58512 1.23758 8.43012 2.29508 7.72512C3.09758 7.19262 4.24508 7.01262 5.27258 7.19262" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.99957 10.9716C8.95457 10.9641 8.90207 10.9641 8.85707 10.9716C7.82207 10.9341 6.99707 10.0866 6.99707 9.03656C6.99707 7.96406 7.85957 7.10156 8.93207 7.10156C10.0046 7.10156 10.8671 7.97156 10.8671 9.03656C10.8596 10.0866 10.0346 10.9416 8.99957 10.9716Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.81656 13.3345C5.75906 14.0395 5.75906 15.1945 6.81656 15.8995C8.01656 16.702 9.98156 16.702 11.1816 15.8995C12.2391 15.1945 12.2391 14.0395 11.1816 13.3345C9.98906 12.5395 8.01656 12.5395 6.81656 13.3345Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function CancelStampIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}
            className={`h-auto ${className}`}>
            <path d="M2.99167 10.9958L1.85168 9.8558C1.38668 9.3908 1.38668 8.62579 1.85168 8.16079L2.99167 7.02078C3.18667 6.82578 3.34417 6.44327 3.34417 6.17327V4.56076C3.34417 3.90076 3.88418 3.36077 4.54418 3.36077H6.15667C6.42667 3.36077 6.80918 3.2033 7.00418 3.0083L8.14417 1.86828C8.60917 1.40328 9.37418 1.40328 9.83918 1.86828L10.9792 3.0083C11.1742 3.2033 11.5567 3.36077 11.8267 3.36077H13.4392C14.0992 3.36077 14.6392 3.90076 14.6392 4.56076V6.17327C14.6392 6.44327 14.7967 6.82578 14.9917 7.02078L16.1317 8.16079C16.5967 8.62579 16.5967 9.3908 16.1317 9.8558L14.9917 10.9958C14.7967 11.1908 14.6392 11.5733 14.6392 11.8433V13.4557C14.6392 14.1157 14.0992 14.6558 13.4392 14.6558H11.8267C11.5567 14.6558 11.1742 14.8133 10.9792 15.0083L9.83918 16.1483C9.37418 16.6133 8.60917 16.6133 8.14417 16.1483L7.00418 15.0083C6.80918 14.8133 6.42667 14.6558 6.15667 14.6558H4.54418C3.88418 14.6558 3.34417 14.1157 3.34417 13.4557V11.8433C3.34417 11.5658 3.18667 11.1833 2.99167 10.9958Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.75 11.25L11.25 6.75" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M10.8709 10.875H10.8776" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7.12088 7.125H7.12762" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
};

export function RateIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}
            className={`h-auto ${className}`}>
            <path d="M6.75 1.5H11.25C15 1.5 16.5 3 16.5 6.75V11.25C16.5 15 15 16.5 11.25 16.5H6.75C3 16.5 1.5 15 1.5 11.25V6.75C1.5 3 3 1.5 6.75 1.5Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.42773 11.4519L11.3327 6.54688" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.73501 7.77859C7.24449 7.77859 7.65749 7.36558 7.65749 6.8561C7.65749 6.34662 7.24449 5.93359 6.73501 5.93359C6.22553 5.93359 5.8125 6.34662 5.8125 6.8561C5.8125 7.36558 6.22553 7.77859 6.73501 7.77859Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M11.6403 12.0676C12.1497 12.0676 12.5628 11.6546 12.5628 11.1451C12.5628 10.6357 12.1497 10.2227 11.6403 10.2227C11.1308 10.2227 10.7178 10.6357 10.7178 11.1451C10.7178 11.6546 11.1308 12.0676 11.6403 12.0676Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
};


export function CardsCycleIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}
            className={`h-auto ${className}`}>
            <path d="M9 4.17188H16.5" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M10.665 1.5H14.835C16.17 1.5 16.5 1.83 16.5 3.15V6.2325C16.5 7.5525 16.17 7.8825 14.835 7.8825H10.665C9.33 7.8825 9 7.5525 9 6.2325V3.15C9 1.83 9.33 1.5 10.665 1.5Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M1.5 12.7969H9" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.165 10.125H7.335C8.67 10.125 9 10.455 9 11.775V14.8575C9 16.1775 8.67 16.5075 7.335 16.5075H3.165C1.83 16.5075 1.5 16.1775 1.5 14.8575V11.775C1.5 10.455 1.83 10.125 3.165 10.125Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16.5 11.25C16.5 14.1525 14.1525 16.5 11.25 16.5L12.0375 15.1875" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M1.5 6.75C1.5 3.8475 3.8475 1.5 6.75 1.5L5.96251 2.8125" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}


export function CardClockIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}
            className={`h-auto ${className}`}>
            <path d="M9 10.875C10.0355 10.875 10.875 10.0355 10.875 9C10.875 7.96447 10.0355 7.125 9 7.125C7.96447 7.125 7.125 7.96447 7.125 9C7.125 10.0355 7.96447 10.875 9 10.875Z" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13.875 7.125V10.875" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.75 16.5C5.40685 16.5 6.75 15.1569 6.75 13.5C6.75 11.8431 5.40685 10.5 3.75 10.5C2.09315 10.5 0.75 11.8431 0.75 13.5C0.75 15.1569 2.09315 16.5 3.75 16.5Z" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.9375 12.5625V13.26C3.9375 13.5225 3.80251 13.77 3.57001 13.905L3 14.25" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M1.5 11.4V6.75C1.5 4.125 3 3 5.25 3H12.75C15 3 16.5 4.125 16.5 6.75V11.25C16.5 13.875 15 15 12.75 15H6.375" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
};



export function UserIcon({ className, color = '#191919', ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} `}
            {...rest}
        >
            <path
                d="M9.11992 8.1525C9.04492 8.145 8.95492 8.145 8.87242 8.1525C7.08742 8.0925 5.66992 6.63 5.66992 4.83C5.66992 2.9925 7.15492 1.5 8.99992 1.5C10.8374 1.5 12.3299 2.9925 12.3299 4.83C12.3224 6.63 10.9049 8.0925 9.11992 8.1525Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M5.37004 10.92C3.55504 12.135 3.55504 14.115 5.37004 15.3225C7.43254 16.7025 10.815 16.7025 12.8775 15.3225C14.6925 14.1075 14.6925 12.1275 12.8775 10.92C10.8225 9.5475 7.44004 9.5475 5.37004 10.92Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export function MailIcon({ className, color = '#191919', ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} `}
            {...rest}
        >
            <path
                d="M12.75 15.375H5.25C3 15.375 1.5 14.25 1.5 11.625V6.375C1.5 3.75 3 2.625 5.25 2.625H12.75C15 2.625 16.5 3.75 16.5 6.375V11.625C16.5 14.25 15 15.375 12.75 15.375Z"
                stroke={color}
                stroke-width="1.5"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M12.75 6.75L10.4025 8.625C9.63 9.24 8.3625 9.24 7.59 8.625L5.25 6.75"
                stroke={color}
                stroke-width="1.5"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};


export function PhoneIcon({ className, color = '#191919', ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} `}
            {...rest}
        >
            <path
                d="M16.4775 13.7475C16.4775 14.0175 16.4175 14.295 16.29 14.565C16.1625 14.835 15.9975 15.09 15.78 15.33C15.4125 15.735 15.0075 16.0275 14.55 16.215C14.1 16.4025 13.6125 16.5 13.0875 16.5C12.3225 16.5 11.505 16.32 10.6425 15.9525C9.78 15.585 8.9175 15.09 8.0625 14.4675C7.2 13.8375 6.3825 13.14 5.6025 12.3675C4.83 11.5875 4.1325 10.77 3.51 9.915C2.895 9.06 2.4 8.205 2.04 7.3575C1.68 6.5025 1.5 5.685 1.5 4.905C1.5 4.395 1.59 3.9075 1.77 3.4575C1.95 3 2.235 2.58 2.6325 2.205C3.1125 1.7325 3.6375 1.5 4.1925 1.5C4.4025 1.5 4.6125 1.545 4.8 1.635C4.995 1.725 5.1675 1.86 5.3025 2.055L7.0425 4.5075C7.1775 4.695 7.275 4.8675 7.3425 5.0325C7.41 5.19 7.4475 5.3475 7.4475 5.49C7.4475 5.67 7.395 5.85 7.29 6.0225C7.1925 6.195 7.05 6.375 6.87 6.555L6.3 7.1475C6.2175 7.23 6.18 7.3275 6.18 7.4475C6.18 7.5075 6.1875 7.56 6.2025 7.62C6.225 7.68 6.2475 7.725 6.2625 7.77C6.3975 8.0175 6.63 8.34 6.96 8.73C7.2975 9.12 7.6575 9.5175 8.0475 9.915C8.4525 10.3125 8.8425 10.68 9.24 11.0175C9.63 11.3475 9.9525 11.5725 10.2075 11.7075C10.245 11.7225 10.29 11.745 10.3425 11.7675C10.4025 11.79 10.4625 11.7975 10.53 11.7975C10.6575 11.7975 10.755 11.7525 10.8375 11.67L11.4075 11.1075C11.595 10.92 11.775 10.7775 11.9475 10.6875C12.12 10.5825 12.2925 10.53 12.48 10.53C12.6225 10.53 12.7725 10.56 12.9375 10.6275C13.1025 10.695 13.275 10.7925 13.4625 10.92L15.945 12.6825C16.14 12.8175 16.275 12.975 16.3575 13.1625C16.4325 13.35 16.4775 13.5375 16.4775 13.7475Z"
                stroke={color}
                stroke-width="1.5"
                stroke-miterlimit="10"
            />
        </svg>
    );
};


export function ReturnIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} `}
            {...rest}
        >
            <path
                d="M12.6523 13.7344H6.65234C4.58234 13.7344 2.90234 12.0544 2.90234 9.98438C2.90234 7.91438 4.58234 6.23438 6.65234 6.23438H14.9023"
                stroke="#191919"
                stroke-width="1.5"
                stroke-miterlimit="10"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M13.1777 8.10563L15.0977 6.18562L13.1777 4.26562"
                stroke="#191919"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );

};


export function TornPaperIcon({ className, color = '#888888', ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} `}
            {...rest}
        >
            <path
                d="M6.73 19.7C7.55 18.82 8.8 18.89 9.52 19.85L10.53 21.2C11.34 22.27 12.65 22.27 13.46 21.2L14.47 19.85C15.19 18.89 16.44 18.82 17.26 19.7C19.04 21.6 20.49 20.97 20.49 18.31V7.04C20.5 3.01 19.56 2 15.78 2H8.22C4.44 2 3.5 3.01 3.5 7.04V18.3C3.5 20.97 4.96 21.59 6.73 19.7Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M8 7H16"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round" />
            <path
                d="M9 11H15"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export function PropertiesIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M9.75 16.5H3.75C2.25 16.5 1.5 15.75 1.5 14.25V8.25C1.5 6.75 2.25 6 3.75 6H7.5V14.25C7.5 15.75 8.25 16.5 9.75 16.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.58249 3C7.52249 3.225 7.5 3.4725 7.5 3.75V6H3.75V4.5C3.75 3.675 4.425 3 5.25 3H7.58249Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 6V9.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.5 6V9.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.75 12.75H11.25C10.8375 12.75 10.5 13.0875 10.5 13.5V16.5H13.5V13.5C13.5 13.0875 13.1625 12.75 12.75 12.75Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 9.75V12.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 14.25V3.75C7.5 2.25 8.25 1.5 9.75 1.5H14.25C15.75 1.5 16.5 2.25 16.5 3.75V14.25C16.5 15.75 15.75 16.5 14.25 16.5H9.75C8.25 16.5 7.5 15.75 7.5 14.25Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function PriceTagIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}
            className={`h-auto ${className}`}>
            <path d="M3.30357 11.6448L6.70107 15.0423C8.09607 16.4373 10.3611 16.4373 11.7636 15.0423L15.0561 11.7498C16.4511 10.3548 16.4511 8.08977 15.0561 6.68727L11.6511 3.29728C10.9386 2.58478 9.95607 2.20228 8.95107 2.25478L5.20107 2.43478C3.70107 2.50228 2.50857 3.69478 2.43357 5.18728L2.25357 8.93727C2.20857 9.94977 2.59107 10.9323 3.30357 11.6448Z" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7.30078 9.16797C8.33632 9.16797 9.17578 8.3285 9.17578 7.29297C9.17578 6.25743 8.33632 5.41797 7.30078 5.41797C6.26525 5.41797 5.42578 6.25743 5.42578 7.29297C5.42578 8.3285 6.26525 9.16797 7.30078 9.16797Z" stroke={color} stroke-width="1.5" stroke-linecap="round" />
            <path d="M9.92578 12.918L12.9258 9.91797" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
};


export function UnitIcon({ className, color = "#191919", ...rest }: { className?: string, color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" >
            <path d="M1.5 16.5H16.5" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" {...rest}
                className={`h-auto ${className}`} />
            <path d="M2.21289 16.5009L2.25039 7.47841C2.25039 7.02091 2.46789 6.58595 2.82789 6.30095L8.07789 2.21344C8.61789 1.79344 9.3754 1.79344 9.9229 2.21344L15.1729 6.29344C15.5404 6.57844 15.7504 7.01341 15.7504 7.47841V16.5009" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linejoin="round" />
            <path d="M11.625 8.25H6.375C5.7525 8.25 5.25 8.7525 5.25 9.375V16.5H12.75V9.375C12.75 8.7525 12.2475 8.25 11.625 8.25Z" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7.5 12.1875V13.3125" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7.875 5.625H10.125" stroke={color} stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

    );
};

export function FinancialsIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.75 2.25V5.25H15.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.5 1.5L12.75 5.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.99078 12.7513V9.86H6.11328V9.14H6.99078V8.2175H6.11328V7.4975H6.99078V4.71875H8.16078L9.22953 7.4975H10.557V4.71875H11.4458V7.4975H12.3233V8.2175H11.4458V9.14H12.3233V9.86H11.4458V12.7513H10.2645L9.19578 9.86H7.86828V12.7513H6.99078ZM7.86828 9.14H8.92578L8.58828 8.2175H7.84578L7.86828 9.14ZM10.557 11.165H10.602L10.5683 9.86H10.0958L10.557 11.165ZM7.84578 7.4975H8.31828L7.84578 6.1025H7.80078L7.84578 7.4975ZM9.82578 9.14H10.5795L10.557 8.2175H9.48828L9.82578 9.14Z" fill={color} />
        </svg>

    );
};

export function BookingIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 14.25H12C13.5 14.25 14.25 13.5 14.25 12V6C14.25 4.5 13.5 3.75 12 3.75H6C4.5 3.75 3.75 4.5 3.75 6V12C3.75 13.5 4.5 14.25 6 14.25Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.75 7.125H5.61C6.645 7.125 7.485 7.965 7.485 9C7.485 10.035 6.645 10.875 5.61 10.875H3.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.25 7.49219H12" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.25 10.5H12" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.40039 9H5.47539" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function OpenWalletIcon({ className, color = "#888888", ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12.66 2.51814L12.63 2.58814L9.72996 9.31814H6.87996C6.19996 9.31814 5.54996 9.45814 4.95996 9.70814L6.70996 5.52814L6.74996 5.42814L6.81996 5.26814C6.83996 5.20814 6.85996 5.14814 6.88996 5.09814C8.19996 2.06814 9.67996 1.37814 12.66 2.51814Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M18.0505 9.51953C17.6005 9.37953 17.1205 9.31953 16.6405 9.31953H9.73047L12.6305 2.58953L12.6605 2.51953C12.8105 2.56953 12.9505 2.63953 13.1005 2.69953L15.3105 3.62953C16.5405 4.13953 17.4005 4.66953 17.9205 5.30953C18.0205 5.42953 18.1005 5.53953 18.1705 5.66953C18.2605 5.80953 18.3305 5.94953 18.3705 6.09953C18.4105 6.18953 18.4405 6.27953 18.4605 6.35953C18.7305 7.19953 18.5705 8.22953 18.0505 9.51953Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M21.5217 14.2003V16.1503C21.5217 16.3503 21.5117 16.5503 21.5017 16.7503C21.3117 20.2403 19.3617 22.0003 15.6617 22.0003H7.86172C7.62172 22.0003 7.38172 21.9803 7.15172 21.9503C3.97172 21.7403 2.27172 20.0403 2.06172 16.8603C2.03172 16.6303 2.01172 16.3903 2.01172 16.1503V14.2003C2.01172 12.1903 3.23172 10.4603 4.97172 9.71031C5.57172 9.46031 6.21172 9.32031 6.89172 9.32031H16.6517C17.1417 9.32031 17.6217 9.39031 18.0617 9.52031C20.0517 10.1303 21.5217 11.9903 21.5217 14.2003Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M6.71 5.52734L4.96 9.70734C3.22 10.4573 2 12.1873 2 14.1973V11.2673C2 8.42734 4.02 6.05734 6.71 5.52734Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M21.5186 11.2677V14.1977C21.5186 11.9977 20.0586 10.1277 18.0586 9.52766C18.5786 8.22766 18.7286 7.20766 18.4786 6.35766C18.4586 6.26766 18.4286 6.17766 18.3886 6.09766C20.2486 7.05766 21.5186 9.02766 21.5186 11.2677Z"
                stroke={color}
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};


export function ArrowIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M10.3768 3.28592L6.15966 7.50306C5.66162 8.0011 5.66162 8.81607 6.15966 9.31411L10.3768 13.5312" stroke={color} strokeWidth="1.9404" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function ArrowLongIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M10.5407 5.5799L6.99982 2.03906L3.45898 5.5799" stroke={color} strokeWidth="0.875" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 11.962V2.14453" stroke={color} strokeWidth="0.875" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function PrinterIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M5.4375 5.25H12.5625V3.75C12.5625 2.25 12 1.5 10.3125 1.5H7.6875C6 1.5 5.4375 2.25 5.4375 3.75V5.25Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 11.25V14.25C12 15.75 11.25 16.5 9.75 16.5H8.25C6.75 16.5 6 15.75 6 14.25V11.25H12Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.75 7.5V11.25C15.75 12.75 15 13.5 13.5 13.5H12V11.25H6V13.5H4.5C3 13.5 2.25 12.75 2.25 11.25V7.5C2.25 6 3 5.25 4.5 5.25H13.5C15 5.25 15.75 6 15.75 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.75 11.25H11.8425H5.25" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.25 8.25H7.5" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function SearchIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.9304 20.6888C19.4604 22.2888 20.6704 22.4488 21.6004 21.0488C22.4504 19.7688 21.8904 18.7188 20.3504 18.7188C19.2104 18.7088 18.5704 19.5988 18.9304 20.6888Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function ClockIcon({ className, color = '#888888', ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5C13.14 1.5 16.5 4.86 16.5 9Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.7827 11.3853L9.45766 9.99781C9.05266 9.75781 8.72266 9.18031 8.72266 8.70781V5.63281" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

    );
};

export function DotsIcon({ className, color = "currentColor", ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M5 10C3.9 10 3 10.9 3 12C3 13.1 3.9 14 5 14C6.1 14 7 13.1 7 12C7 10.9 6.1 10 5 10Z" fill={color} stroke={color} strokeWidth="1.5" />
            <path d="M19 10C17.9 10 17 10.9 17 12C17 13.1 17.9 14 19 14C20.1 14 21 13.1 21 12C21 10.9 20.1 10 19 10Z" fill={color} stroke={color} strokeWidth="1.5" />
            <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill={color} stroke={color} strokeWidth="1.5" />
        </svg>
    );
};

export function CalendarIcon({ className, color = '#F4F4F4', ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M6 1.5V3.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 1.5V3.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.625 6.81641H15.375" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.75 6.375V12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.7713 10.2734H11.778" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.7713 12.5234H11.778" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.99686 10.2734H9.00359" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.99686 12.5234H9.00359" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.22049 10.2734H6.22723" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.22049 12.5234H6.22723" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function TilesIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M12.75 7.5H14.25C15.75 7.5 16.5 6.75 16.5 5.25V3.75C16.5 2.25 15.75 1.5 14.25 1.5H12.75C11.25 1.5 10.5 2.25 10.5 3.75V5.25C10.5 6.75 11.25 7.5 12.75 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.75 16.5H5.25C6.75 16.5 7.5 15.75 7.5 14.25V12.75C7.5 11.25 6.75 10.5 5.25 10.5H3.75C2.25 10.5 1.5 11.25 1.5 12.75V14.25C1.5 15.75 2.25 16.5 3.75 16.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 7.5C6.15685 7.5 7.5 6.15685 7.5 4.5C7.5 2.84315 6.15685 1.5 4.5 1.5C2.84315 1.5 1.5 2.84315 1.5 4.5C1.5 6.15685 2.84315 7.5 4.5 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.5 16.5C15.1569 16.5 16.5 15.1569 16.5 13.5C16.5 11.8431 15.1569 10.5 13.5 10.5C11.8431 10.5 10.5 11.8431 10.5 13.5C10.5 15.1569 11.8431 16.5 13.5 16.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function FilterIcon({ className, color, ...rest }: { className?: string, color?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
            className={`h-auto ${className}`}
        >
            <path d="M16.5 4.875H12" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 4.875H1.5" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 7.5C8.94975 7.5 10.125 6.32475 10.125 4.875C10.125 3.42525 8.94975 2.25 7.5 2.25C6.05025 2.25 4.875 3.42525 4.875 4.875C4.875 6.32475 6.05025 7.5 7.5 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.5 13.125H13.5" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 13.125H1.5" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 15.75C11.9497 15.75 13.125 14.5747 13.125 13.125C13.125 11.6753 11.9497 10.5 10.5 10.5C9.05025 10.5 7.875 11.6753 7.875 13.125C7.875 14.5747 9.05025 15.75 10.5 15.75Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function TrashIcon({ className, color = "currentColor", ...rest }: { className?: string; color?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill={color}
            className={className}
            {...rest}
        >
            <path d="M10 2L9 3H4v2h1v15a2 2 0 002 2h10a2 2 0 002-2V5h1V3h-5l-1-1h-4zm-3 3h10v15H7V5zm2 2v11h2V7H9zm4 0v11h2V7h-2z"></path>
        </svg>
    );
}
