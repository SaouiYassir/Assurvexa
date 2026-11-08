import './Process.css'

const steps = [
    {num: '01', title: 'Consultation', desc: 'We listen to your household, assets and ambitions at your home, office or by video.'},
    {num: '02', title: 'Proposal', desc: 'A single, bound proposal, clear in scope and price, within five working days.'},
    {num: '03', title: 'Stewardship', desc: 'Annual reviews and a direct line, so your cover evolves as you do.'},
]

function Process() {
    return (
        <section id="process" className="process-section">
            <h1>HOW IT WORKS</h1>
            <h3>Three conversations.</h3>
            <div>
                {steps.map((e, index) => {
                    return <div key={index}><span>{e.num}</span><h4>{e.title}</h4><p>{e.desc}</p></div>
                })}
            </div>
        </section>
    )
}

export default Process;