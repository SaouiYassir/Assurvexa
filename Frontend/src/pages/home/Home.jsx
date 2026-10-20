import Hero from "./sections/Hero";
import Stats from "./sections/Stats";
import Cover from "./sections/Cover";
import Philosophy from "./sections/Philosophy";
import Process from "./sections/Process";

function Home() {
    return (
        <main>
            <Hero />
            <Stats />
            <Cover />
            <Philosophy />
            <Process />
        </main>
    )
}

export default Home;