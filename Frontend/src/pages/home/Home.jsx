import Hero from "./sections/Hero";
import Stats from "./sections/Stats";
import Cover from "./sections/Cover";
import Philosophy from "./sections/Philosophy";

function Home() {
    return (
        <main>
            <Hero />
            <Stats />
            <Cover />
            <Philosophy />
        </main>
    )
}

export default Home;