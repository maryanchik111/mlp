import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Форум mlpcutiefamily - Спільнота любителів My Little Pony',
    description: 'Приєднуйтесь до нашої спільноти! Обговорюйте персонажів, діліться своєю колекцією та дізнавайтесь останні новини My Little Pony на форумі mlpcutiefamily.',
    keywords: ['форум', 'My Little Pony', 'обговорення', 'поні', 'колекція', 'mlpcutiefamily'],
    openGraph: {
        title: 'Форум mlpcutiefamily - Спільнота любителів My Little Pony',
        description: 'Місце для спілкування справжніх броні та любителів MLP. Поділіться своєю любов\'ю до поні!',
        type: 'website',
    },
};

export default function ForumLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
