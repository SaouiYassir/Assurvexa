import './Philosophy.css'

const elements = [
    {num: 'I', title: 'One advisor', desc: 'A named expert for every policy, every claim, every year.'},
    {num: 'II', title: 'Plain terms', desc: 'Contracts written to be read, with no hidden clauses.'},
    {num: 'III', title: 'Swift settlement', desc: 'Claims handled with discretion and paid without dispute.'},
]

function Philosophy() {
    return(
        <section id='philosophy' className='philosophy-section'>
            <div>
                <h1>OUR PHILOSOPHY</h1>
                <p>“Insurance should be felt only on the day you need it, and then not at all”</p>
                <h3>THE ASSURVEXA FOUNDERS</h3>
            </div>

            <div>
                {elements.map((e, index) => {
                    return <div key={index}><span>{e.num}</span><h4>{e.title}</h4><p>{e.desc}</p></div>
                })}
            </div>
        </section>
    )
}

export default Philosophy;