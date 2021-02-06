import { mapGetters, mapState } from 'vuex';
import axios from 'axios';
import { toURL, validateTipUrl } from '../popup/utils/helper';
import { SUPERHERO_HS_AUTH_BASE_URL, SUPERHERO_HS_AUTH_CREDENTIAL_ISSUE_API } from '../popup/utils/hsConstants'

export default {
    data: () => ({
        url: '',
        loading: false,
        ifEdit: false,
        ifCreate: true,
        ifAllDisabled: false,
        profile: {
            email: "",
            name: "",
            did: ""
        },
        copied: false,
    }),
    computed: {
        ...mapGetters(['account', 'hypersign']),
        normalizedUrl() {
            if (!validateTipUrl(this.url)) return '';
            return toURL(this.url).toString();
        },
    },
    async created() {
        if (Object.keys(this.hypersign.profile).length == 0) {
            this.profile.did = this.hypersign.did

        } else {
            this.profile = { ...this.hypersign.profile }
            this.ifEdit = true;
            this.ifCreate = false;
            this.ifAllDisabled = true;
        }
    },
    methods: {
        edit() {
            this.ifAllDisabled = false;
            this.ifEdit = false;
            this.ifCreate = true;
        },
        async setupProfile() {
            try {
                this.loading = true;
                //// HS_TODO::
                // Fetch email, name from text box
                // Fetch did from localstore
                // Call studio register api to get a hypersign credentials
                // Once you get the credential, store it in the localstore. - this we need to think a bit, how will user store it, either in browser storage or how
                const HS_STUDIO_REGISTER_URL = `${SUPERHERO_HS_AUTH_BASE_URL}${SUPERHERO_HS_AUTH_CREDENTIAL_ISSUE_API}`

                const body = {
                    fname: this.profile.name,
                    email: this.profile.email,
                    publicKey: this.profile.did
                }

                //console.log(body)
                return axios.post(HS_STUDIO_REGISTER_URL, body)
                    .then(res => {
                        res = res.data;
                        if (!res) throw new Error("Could not register for hsauth credential");
                        if (res && res.status != 200) throw new Error(res.error);
                        const msg = `
              An email with a QR code has been sent to the address you provided. \
              Scan the code with your Hypersign Wallet to get the credential. \
              You can use this credential to authenticate yourself in any website which \
              supports Hypersign login.
          `
                        this.loading = false;
                        if (res.message) this.$store.dispatch('modals/open', { name: 'default', msg });
                        this.$store.commit('addHSProfile', this.profile);
                        this.ifEdit = true;
                        this.ifCreate = false;
                        this.ifAllDisabled = true;
                    })
                    .catch(e => {
                        this.loading = false;
                        if (e.message) this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
                    })
            } catch (e) {
                this.loading = false;
                if (e.message) this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
            }
        },
    },
};