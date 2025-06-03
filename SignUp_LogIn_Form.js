const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// CLIENT_ID should be securely loaded, for demonstration purposes it's hardcoded here.
// In a production environment, consider fetching this from a secure backend endpoint.
const CLIENT_ID = "1035940168102-r5om89rqfjbcjmr5gv78jlmaat1v5eif.apps.googleusercontent.com";

window.onload = function () {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true
    });

    // Render the Google Sign-In button for the login form
    google.accounts.id.renderButton(
        document.getElementById("g_id_signin_login"),
        { theme: "outline", size: "large", text: "sign_in_with" }
    );

    // Render the Google Sign-In button for the registration form
    google.accounts.id.renderButton(
        document.getElementById("g_id_signin_register"),
        { theme: "outline", size: "large", text: "signup_with" }
    );

    google.accounts.id.prompt();
};

function handleCredentialResponse(response) {
    const idToken = response.credential;
    console.log("Encoded JWT ID token: " + idToken);

    // Send the ID token to your backend for verification
    fetch('/verify-token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({idToken})
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Verification successful:', data);
        alert(`Google login successful! Welcome, ${data.user.name || data.user.email}!`);
        // Here you would typically:
        // 1. Store user session information (e.g., in localStorage or session storage)
        // 2. Redirect the user to your main application dashboard or home page
        // window.location.href = '/dashboard';
    })
    .catch(error => {
        console.error('Error during token verification:', error);
        alert('Google login failed. Please try again.');
    });
}

// Password show/hide animation logic
gsap.registerPlugin(ScrambleTextPlugin, MorphSVGPlugin);

const BLINK_SPEED = 0.075;
const TOGGLE_SPEED = 0.125;
const ENCRYPT_SPEED = 1;

let busy = false;

const passwordInputs = document.querySelectorAll('input[type="password"]');
const toggleButtons = document.querySelectorAll('.password-toggle-btn');

passwordInputs.forEach((INPUT, index) => {
    const TOGGLE = toggleButtons[index];
    const EYE = TOGGLE.querySelector('.eye');
    const PROXY = document.createElement('div');
    const lidUpper = TOGGLE.querySelector('.lid--upper');
    const lidLower = TOGGLE.querySelector('.lid--lower');
    const eyeOpenPath = TOGGLE.querySelector('g[mask^="url(#eye-open"] path'); // Select path within masked group
    const eyeClosedMaskId = TOGGLE.querySelector('mask[id^="eye-closed"]').id;

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`~,.<>?/;":][}{+_)(*&^%$#@!±=-§';

    let blinkTl;
    const BLINK = () => {
        const delay = gsap.utils.random(2, 8);
        const duration = BLINK_SPEED;
        const repeat = Math.random() > 0.5 ? 3 : 1;
        blinkTl = gsap.timeline({
            delay,
            onComplete: () => BLINK(),
            repeat,
            yoyo: true
        }).
        to(lidUpper, {
            morphSVG: lidLower,
            duration
        }).
        to(eyeOpenPath, {
            morphSVG: `#${eyeClosedMaskId} path`,
            duration
        }, 0);
    };

    BLINK();

    const posMapper = gsap.utils.mapRange(-100, 100, 30, -30);
    let reset;

    const MOVE_EYE = ({ x, y }) => {
        if (reset) reset.kill();
        reset = gsap.delayedCall(2, () => {
            gsap.to(EYE, { xPercent: 0, yPercent: 0, duration: 0.2 });
        });
        const BOUNDS = EYE.getBoundingClientRect();
        gsap.set(EYE, {
            xPercent: gsap.utils.clamp(-30, 30, posMapper(BOUNDS.x - x)),
            yPercent: gsap.utils.clamp(-30, 30, posMapper(BOUNDS.y - y))
        });
    };

    // Attach pointermove listener to the input field's container
    INPUT.closest('.form-group').addEventListener('pointermove', MOVE_EYE);

    TOGGLE.addEventListener('click', () => {
        if (busy) return;
        const isText = INPUT.matches('[type=password]');
        const val = INPUT.value;
        busy = true;
        TOGGLE.setAttribute('aria-pressed', isText);
        const duration = TOGGLE_SPEED;

        if (isText) {
            if (blinkTl) blinkTl.kill();

            gsap.timeline({
                onComplete: () => {
                    busy = false;
                }
            })
            .to(lidUpper, {
                morphSVG: lidLower,
                duration
            })
            .to(eyeOpenPath, {
                morphSVG: `#${eyeClosedMaskId} path`,
                duration
            }, 0)
            .to(PROXY, {
                duration: ENCRYPT_SPEED,
                onStart: () => {
                    INPUT.type = 'text';
                },
                onComplete: () => {
                    PROXY.innerHTML = '';
                    INPUT.value = val;
                },
                scrambleText: {
                    chars,
                    text:
                        INPUT.value.charAt(INPUT.value.length - 1) === ' ' ?
                            `${INPUT.value.slice(0, INPUT.value.length - 1)}${chars.charAt(
                                Math.floor(Math.random() * chars.length))
                            }` :
                            INPUT.value
                },
                onUpdate: () => {
                    const len = val.length - PROXY.innerText.length;
                    INPUT.value = `${PROXY.innerText}${new Array(len).fill('•').join('')}`;
                }
            }, 0);
        } else {
            gsap.timeline({
                onComplete: () => {
                    BLINK();
                    busy = false;
                }
            }).
            to(lidUpper, {
                morphSVG: lidUpper,
                duration
            }).
            to(eyeOpenPath, {
                morphSVG: eyeOpenPath,
                duration
            }, 0).
            to(PROXY, {
                duration: ENCRYPT_SPEED,
                onComplete: () => {
                    INPUT.type = 'password';
                    INPUT.value = val;
                    PROXY.innerHTML = '';
                },
                scrambleText: {
                    chars,
                    text: new Array(INPUT.value.length).fill('•').join('')
                },
                onUpdate: () => {
                    INPUT.value = `${PROXY.innerText}${val.slice(
                        PROXY.innerText.length,
                        val.length)
                    }`;
                }
            }, 0);
        }
    });
});

// Prevent default form submission for demonstration purposes (you might want to remove this in production)
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', event => event.preventDefault());
});