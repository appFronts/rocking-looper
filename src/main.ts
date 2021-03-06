import 'regenerator-runtime/runtime';
import {LooperActionRef, LooperViewLayer} from './looper-view';

class LooperComponent {

    stream: MediaStream;
    mediaRecorder: MediaRecorder;

    constructor() {
        // Subscribe to view interactions
        LooperViewLayer.viewInteractionSubject
            .on({name: 'startRecording', fn: () => this.mediaRecorder && this.mediaRecorder.start()});

        LooperViewLayer.viewInteractionSubject
            .on({name: 'stopRecording', fn: () => this.mediaRecorder && this.mediaRecorder.stop()});

        LooperViewLayer.viewInteractionSubject
            .on({name: 'pausePlaying', fn: (element: LooperActionRef) => element.playable && element.playable.pause()});

        LooperViewLayer.viewInteractionSubject
            .on({name: 'resumePlaying', fn: (element: LooperActionRef) => element.playable && element.playable.play()});
    }

    async start () {
        // Getting permission status.
        await navigator.permissions.query({name: 'microphone'});

        // Streaming audio:
        const lineInRef = await this.setupAudioLine();

        // Recording streamed audio!
        await this.setupRecorder();

        return lineInRef;
    }

    private async setupAudioLine() {
        const context = new AudioContext();

        if (context.state === 'suspended') {
            await context.resume();
        }

        this.stream = await navigator.mediaDevices
            .getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false,
                    latency: 0
                }
            });

        const lineInSource = context.createMediaStreamSource(this.stream);
        lineInSource.connect(context.destination);
        return lineInSource;
    }

    private async setupRecorder() {
        this.mediaRecorder = new MediaRecorder(this.stream);
        let chunks: Blob[] = [];

        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
            chunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
            for (const btn of LooperViewLayer.elements) {
                if (LooperViewLayer.lastPressedBtnId === btn.id) {
                    btn.blob = new Blob(chunks, {
                        'type' : 'audio/ogg; codecs=opus',
                    });
                    // Reset chunks
                    chunks = [];

                    const src = btn.blob &&  URL.createObjectURL(btn.blob);
                    if (!src) return;
                    btn.playable = new Audio(src);
                    btn.playable.loop =  true;
                    btn.playable.play();
                }
            }

        };
    }
}

async function main() {

    LooperViewLayer.initView();
    let looper = new LooperComponent();
    const lineInRef = await looper.start();

    const disconnect: HTMLElement = document.querySelector('.disconnect');
    disconnect.onclick = () => {
        lineInRef && lineInRef.disconnect();
        looper = null;
    };
}

main()
    .then(() => console.log('started'));
