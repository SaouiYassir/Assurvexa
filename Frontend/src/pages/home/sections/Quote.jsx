import './Quote.css'
import QuoteForm from './Quoteform';

function Quote() {

    return(
        <section id="quote" className="quote-section">
            <div>
                <h1>REQUEST A QUOTE</h1>
                <h3>Begin with a conversation.</h3>
                <p>Tell us what you wish to protect. An advisor will reply within one working day, with no obligation.</p>
            </div>
            <QuoteForm />
        </section>
    )
}

export default Quote;