import Hero from "./sections/Hero";
import Stats from "./sections/Stats";
import Cover from "./sections/Cover";
import Philosophy from "./sections/Philosophy";
import Process from "./sections/Process";
import Quote from "./sections/Quote";

function Home() {
    return (
        <main>
            <Hero />
            <Stats />
            <Cover />
            <Philosophy />
            <Process />
            <Quote />
        </main>
    )
}

export default Home;