interface PersonalizationData {
    childName: string;
    childAge?: number;
    childGender: string;
    achievements?: string;
    interests?: string;
    specialMessage?: string;
    messageType: string;
}

export function generateSantaScript(data: PersonalizationData): string {
    let script = `Ho ho ho! Merry Christmas! Hello there, ${data.childName}! `;

    script += `This is Santa Claus calling all the way from the North Pole, and I have a very special message just for you! `;

    // Add achievements section
    if (data.achievements) {
        script += `My elves told me all about your wonderful achievements this year. ${data.achievements} I'm so proud of you! `;
    }

    // Add interests section
    if (data.interests) {
        script += `I also heard that you love ${data.interests}. That's wonderful! `;
    }

    // Message type specific content
    switch (data.messageType) {
        case 'christmas-morning':
            script += `On Christmas morning, make sure to look under the tree for some special surprises! Remember, the magic of Christmas is all about love, family, and spreading joy to others. `;
            break;
        case 'bedtime':
            script += `Now it's time for you to get a good night's sleep! Remember, my reindeer and I will be visiting very soon, and I need you to be in dreamland when I arrive! `;
            break;
        case 'encouragement':
            script += `I want you to know that you're doing an amazing job! Keep being kind, keep working hard, and always believe in yourself. `;
            break;
        default:
            script += `Keep being the wonderful person you are, and remember to spread kindness and joy wherever you go! `;
    }

    // Custom special message
    if (data.specialMessage) {
        script += `${data.specialMessage} `;
    }

    script += `Well, I better get back to preparing for Christmas! The elves are waiting for me in the workshop. `;
    script += `Remember, ${data.childName}, I'm always watching, and I know you're on the nice list! `;
    script += `Merry Christmas! Ho ho ho! See you soon!`;

    return script;
}
