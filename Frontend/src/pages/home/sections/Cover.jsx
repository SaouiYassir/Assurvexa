import './Cover.css'
import { House, HeartPlus, LifeBuoy, CarFront, Globe, BriefcaseBusiness } from "lucide-react"

function Cover() {
    const plans = [
        { icon: <House size={28} />, label: "Home", des: "Residences, contents, art and collections, covered at agreed value." },
        { icon: <HeartPlus size={28} />, label: "Health", des: "Private medical cover with direct access to leading specialists." },
        { icon: <LifeBuoy size={28} />, label: "Life", des: "Lasting provision for the people and plans that matter most." },
        { icon: <CarFront size={28} />, label: "Auto", des: "Single vehicles to full private fleets, with concierge assistance." },
        { icon: <Globe size={28} />, label: "Travel", des: "Worldwide medical, repatriation and cancellation, around the clock." },
        { icon: <BriefcaseBusiness size={28} />, label: "Business", des: "Liability, property and key-person cover for owner-led companies." },
    ];

    return (
        <section id="cover" className="cover">
            {/* Section Header */}
            <div className="container">
                <div className="cover__header">
                    <p className="eyebrow">OUR COVER</p>
                    <h2 className="section__title">Six lines. One relationship</h2>
                    <p className="section-description">
                        Each policy is composed around you, then reviewed every year, so your protection keeps pace with your life.
                    </p>
                </div>
            </div>

            {/* Grid Container */}
            <div className="container">
                <div className="cover__grid">
                    {plans.map((plan, index) => (
                        <div className="cover__card" key={index}>
                            <div className="cover__icon">
                                {plan.icon}
                            </div>
                            <h3 className="cover__title">{plan.label}</h3>
                            <p className="cover__desc">{plan.des}</p>
                            <p className="cover__enquire">Enquire</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Cover;