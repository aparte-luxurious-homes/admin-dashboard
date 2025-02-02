export function BellIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M9.01494 2.18359C6.53244 2.18359 4.51494 4.20109 4.51494 6.68359V8.85109C4.51494 9.30859 4.31994 10.0061 4.08744 10.3961L3.22494 11.8286C2.69244 12.7136 3.05994 13.6961 4.03494 14.0261C7.26744 15.1061 10.7549 15.1061 13.9874 14.0261C14.8949 13.7261 15.2924 12.6536 14.7974 11.8286L13.9349 10.3961C13.7099 10.0061 13.5149 9.30859 13.5149 8.85109V6.68359C13.5149 4.20859 11.4899 2.18359 9.01494 2.18359Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M10.402 2.40203C10.1695 2.33453 9.92945 2.28203 9.68195 2.25203C8.96195 2.16203 8.27195 2.21453 7.62695 2.40203C7.84445 1.84703 8.38445 1.45703 9.01445 1.45703C9.64445 1.45703 10.1845 1.84703 10.402 2.40203Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.2646 14.293C11.2646 15.5305 10.2521 16.543 9.01465 16.543C8.39965 16.543 7.82965 16.288 7.42465 15.883C7.01965 15.478 6.76465 14.908 6.76465 14.293" stroke={color} strokeMiterlimit="10"/>
        </svg>
    );
};


export function SettingsIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 9.66105V8.34105C1.5 7.56105 2.1375 6.91605 2.925 6.91605C4.2825 6.91605 4.8375 5.95605 4.155 4.77855C3.765 4.10355 3.9975 3.22605 4.68 2.83605L5.9775 2.09355C6.57 1.74105 7.335 1.95105 7.6875 2.54355L7.77 2.68605C8.445 3.86355 9.555 3.86355 10.2375 2.68605L10.32 2.54355C10.6725 1.95105 11.4375 1.74105 12.03 2.09355L13.3275 2.83605C14.01 3.22605 14.2425 4.10355 13.8525 4.77855C13.17 5.95605 13.725 6.91605 15.0825 6.91605C15.8625 6.91605 16.5075 7.55355 16.5075 8.34105V9.66105C16.5075 10.4411 15.87 11.0861 15.0825 11.0861C13.725 11.0861 13.17 12.0461 13.8525 13.2236C14.2425 13.9061 14.01 14.7761 13.3275 15.1661L12.03 15.9086C11.4375 16.2611 10.6725 16.0511 10.32 15.4586L10.2375 15.3161C9.5625 14.1386 8.4525 14.1386 7.77 15.3161L7.6875 15.4586C7.335 16.0511 6.57 16.2611 5.9775 15.9086L4.68 15.1661C3.9975 14.7761 3.765 13.8986 4.155 13.2236C4.8375 12.0461 4.2825 11.0861 2.925 11.0861C2.1375 11.0861 1.5 10.4411 1.5 9.66105Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
};

export function UsersIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M13.4996 5.37C13.4546 5.3625 13.4021 5.3625 13.3571 5.37C12.3221 5.3325 11.4971 4.485 11.4971 3.435C11.4971 2.3625 12.3596 1.5 13.4321 1.5C14.5046 1.5 15.3671 2.37 15.3671 3.435C15.3596 4.485 14.5346 5.3325 13.4996 5.37Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.7276 10.8301C13.7551 11.0026 14.8876 10.8226 15.6826 10.2901C16.7401 9.58512 16.7401 8.43012 15.6826 7.72512C14.8801 7.19262 13.7326 7.01262 12.7051 7.19262" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.47785 5.37C4.52285 5.3625 4.57535 5.3625 4.62035 5.37C5.65535 5.3325 6.48035 4.485 6.48035 3.435C6.48035 2.3625 5.61785 1.5 4.54535 1.5C3.47285 1.5 2.61035 2.37 2.61035 3.435C2.61785 4.485 3.44285 5.3325 4.47785 5.37Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.25008 10.8301C4.22258 11.0026 3.09008 10.8226 2.29508 10.2901C1.23758 9.58512 1.23758 8.43012 2.29508 7.72512C3.09758 7.19262 4.24508 7.01262 5.27258 7.19262" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.99957 10.9716C8.95457 10.9641 8.90207 10.9641 8.85707 10.9716C7.82207 10.9341 6.99707 10.0866 6.99707 9.03656C6.99707 7.96406 7.85957 7.10156 8.93207 7.10156C10.0046 7.10156 10.8671 7.97156 10.8671 9.03656C10.8596 10.0866 10.0346 10.9416 8.99957 10.9716Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.81656 13.3345C5.75906 14.0395 5.75906 15.1945 6.81656 15.8995C8.01656 16.702 9.98156 16.702 11.1816 15.8995C12.2391 15.1945 12.2391 14.0395 11.1816 13.3345C9.98906 12.5395 8.01656 12.5395 6.81656 13.3345Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};


export function PropertiesIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M9.75 16.5H3.75C2.25 16.5 1.5 15.75 1.5 14.25V8.25C1.5 6.75 2.25 6 3.75 6H7.5V14.25C7.5 15.75 8.25 16.5 9.75 16.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.58249 3C7.52249 3.225 7.5 3.4725 7.5 3.75V6H3.75V4.5C3.75 3.675 4.425 3 5.25 3H7.58249Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.5 6V9.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.5 6V9.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.75 12.75H11.25C10.8375 12.75 10.5 13.0875 10.5 13.5V16.5H13.5V13.5C13.5 13.0875 13.1625 12.75 12.75 12.75Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.5 9.75V12.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.5 14.25V3.75C7.5 2.25 8.25 1.5 9.75 1.5H14.25C15.75 1.5 16.5 2.25 16.5 3.75V14.25C16.5 15.75 15.75 16.5 14.25 16.5H9.75C8.25 16.5 7.5 15.75 7.5 14.25Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function FinancialsIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.75 2.25V5.25H15.75" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.5 1.5L12.75 5.25" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.99078 12.7513V9.86H6.11328V9.14H6.99078V8.2175H6.11328V7.4975H6.99078V4.71875H8.16078L9.22953 7.4975H10.557V4.71875H11.4458V7.4975H12.3233V8.2175H11.4458V9.14H12.3233V9.86H11.4458V12.7513H10.2645L9.19578 9.86H7.86828V12.7513H6.99078ZM7.86828 9.14H8.92578L8.58828 8.2175H7.84578L7.86828 9.14ZM10.557 11.165H10.602L10.5683 9.86H10.0958L10.557 11.165ZM7.84578 7.4975H8.31828L7.84578 6.1025H7.80078L7.84578 7.4975ZM9.82578 9.14H10.5795L10.557 8.2175H9.48828L9.82578 9.14Z" fill={color}/>
        </svg>

    );
};

export function BookingIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 14.25H12C13.5 14.25 14.25 13.5 14.25 12V6C14.25 4.5 13.5 3.75 12 3.75H6C4.5 3.75 3.75 4.5 3.75 6V12C3.75 13.5 4.5 14.25 6 14.25Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.75 7.125H5.61C6.645 7.125 7.485 7.965 7.485 9C7.485 10.035 6.645 10.875 5.61 10.875H3.75" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.25 7.49219H12" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.25 10.5H12" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.40039 9H5.47539" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};


export function ArrowIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M10.3768 3.28592L6.15966 7.50306C5.66162 8.0011 5.66162 8.81607 6.15966 9.31411L10.3768 13.5312" stroke={color} strokeWidth="1.9404" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function ArrowLongIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M10.5407 5.5799L6.99982 2.03906L3.45898 5.5799" stroke={color} strokeWidth="0.875" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 11.962V2.14453" stroke={color} strokeWidth="0.875" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function PrinterIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M5.4375 5.25H12.5625V3.75C12.5625 2.25 12 1.5 10.3125 1.5H7.6875C6 1.5 5.4375 2.25 5.4375 3.75V5.25Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11.25V14.25C12 15.75 11.25 16.5 9.75 16.5H8.25C6.75 16.5 6 15.75 6 14.25V11.25H12Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.75 7.5V11.25C15.75 12.75 15 13.5 13.5 13.5H12V11.25H6V13.5H4.5C3 13.5 2.25 12.75 2.25 11.25V7.5C2.25 6 3 5.25 4.5 5.25H13.5C15 5.25 15.75 6 15.75 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.75 11.25H11.8425H5.25" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.25 8.25H7.5" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function SearchIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.9304 20.6888C19.4604 22.2888 20.6704 22.4488 21.6004 21.0488C22.4504 19.7688 21.8904 18.7188 20.3504 18.7188C19.2104 18.7088 18.5704 19.5988 18.9304 20.6888Z" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function ClockIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.9304 20.6888C19.4604 22.2888 20.6704 22.4488 21.6004 21.0488C22.4504 19.7688 21.8904 18.7188 20.3504 18.7188C19.2104 18.7088 18.5704 19.5988 18.9304 20.6888Z" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function DotsIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5C13.14 1.5 16.5 4.86 16.5 9Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.7827 11.3853L9.45766 9.99781C9.05266 9.75781 8.72266 9.18031 8.72266 8.70781V5.63281" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function CalendarIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M6 1.5V3.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 1.5V3.75" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.625 6.81641H15.375" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.75 6.375V12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.7713 10.2734H11.778" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.7713 12.5234H11.778" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.99686 10.2734H9.00359" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.99686 12.5234H9.00359" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.22049 10.2734H6.22723" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.22049 12.5234H6.22723" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

export function TilesIcon({ className, color, ...rest }: { className?: string, color?: string}) {
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
            <path d="M12.75 7.5H14.25C15.75 7.5 16.5 6.75 16.5 5.25V3.75C16.5 2.25 15.75 1.5 14.25 1.5H12.75C11.25 1.5 10.5 2.25 10.5 3.75V5.25C10.5 6.75 11.25 7.5 12.75 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.75 16.5H5.25C6.75 16.5 7.5 15.75 7.5 14.25V12.75C7.5 11.25 6.75 10.5 5.25 10.5H3.75C2.25 10.5 1.5 11.25 1.5 12.75V14.25C1.5 15.75 2.25 16.5 3.75 16.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.5 7.5C6.15685 7.5 7.5 6.15685 7.5 4.5C7.5 2.84315 6.15685 1.5 4.5 1.5C2.84315 1.5 1.5 2.84315 1.5 4.5C1.5 6.15685 2.84315 7.5 4.5 7.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.5 16.5C15.1569 16.5 16.5 15.1569 16.5 13.5C16.5 11.8431 15.1569 10.5 13.5 10.5C11.8431 10.5 10.5 11.8431 10.5 13.5C10.5 15.1569 11.8431 16.5 13.5 16.5Z" stroke={color} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};