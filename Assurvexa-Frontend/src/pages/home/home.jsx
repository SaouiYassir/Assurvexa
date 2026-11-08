import Hero from "./sections/Hero"
import Stats from "./sections/Stats";
import Cover from "./sections/cover";
import Process from "./sections/Process";
import Philosophy from "./sections/Philosophy";

function Home() {
    return (
        <main>
            <Hero />
            <Stats />
            <Cover />
            <Process />
            <Philosophy />
        </main>
    )
}

export default Home;