import './stats.css'

const infos = [
    {stat:'26', label:'YEARS OF SERVICE'},
    {stat:'98%', label:'Claims upheld'},
    {stat:'48h', label:'Average settlement'},
    {stat:'A+', label:'Financial strength'}
]

function Stats() {
    return(
        <section id="stats" className="stats">
            {infos.map((e) => {
                return(
                    <div key={e.label} className="stats-item">
                        <b>{e.stat}</b> <span>{e.label}</span>
                    </div>
                );
            })}
        </section>
    )
}

export default Stats;