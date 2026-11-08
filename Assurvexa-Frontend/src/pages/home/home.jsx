import Hero from "./sections/Hero"
import Stats from "./sections/Stats";
import Cover from "./sections/cover";
import Process from "./sections/Process";
import Philosophy from "./sections/Philosophy";
import Quote from "./sections/Quote";

function Home() {
    return (
        <main>
            <Hero />
            <Stats />
            <Cover />
            <Process />
            <Philosophy />
            <Quote />
        </main>
    )
}

export default Home;