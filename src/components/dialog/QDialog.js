import { QModal } from '../modal'
import { QInput } from '../input'
import { QBtn } from '../btn'
import { QOptionGroup } from '../option-group'
import clone from '../../utils/clone'
import extend from '../../utils/extend'
import { getEventKey } from '../../utils/event'

export default {
  name: 'QDialog',
  props: {
    value: Boolean,
    title: String,
    message: String,
    prompt: Object,
    options: Object,
    ok: {
      type: [String, Object, Boolean],
      default: true
    },
    cancel: [String, Object, Boolean],
    stackButtons: Boolean,
    preventClose: Boolean,
    noBackdropDismiss: Boolean,
    noEscDismiss: Boolean,
    position: String,
    color: {
      type: String,
      default: 'primary'
    }
  },
  render (h) {
    const
      child = [],
      title = this.$slots.title || this.title,
      msg = this.$slots.message || this.message

    if (title) {
      child.push(
        h('div', {
          staticClass: 'modal-header'
        }, [ title ])
      )
    }
    if (msg) {
      child.push(
        h('div', {
          staticClass: 'modal-body modal-message modal-scroll'
        }, [ msg ])
      )
    }

    if (this.hasForm || this.$slots.body) {
      child.push(
        h(
          'div',
          { staticClass: 'modal-body modal-scroll' },
          this.hasForm
            ? (this.prompt ? this.__getPrompt(h) : this.__getOptions(h))
            : [ this.$slots.body ]
        )
      )
    }

    if (this.$scopedSlots.buttons) {
      child.push(
        h('div', {
          staticClass: 'modal-buttons',
          'class': this.buttonClass
        }, [
          this.$scopedSlots.buttons({
            ok: this.__onOk,
            cancel: this.__onCancel
          })
        ])
      )
    }
    else if (this.ok || this.cancel) {
      child.push(this.__getButtons(h))
    }

    return h(QModal, {
      ref: 'modal',
      props: {
        value: this.value,
        minimized: true,
        noBackdropDismiss: this.noBackdropDismiss || this.preventClose,
        noEscDismiss: this.noEscDismiss || this.preventClose,
        position: this.position
      },
      on: {
        input: val => {
          this.$emit('input', val)
        },
        show: () => {
          this.$emit('show')

          if (!this.$q.platform.is.desktop || (!this.prompt && !this.options)) {
            return
          }

          let node = this.prompt
            ? this.$refs.modal.$el.getElementsByTagName('INPUT')
            : this.$refs.modal.$el.getElementsByClassName('q-option')

          if (node.length) {
            node[0].focus()
            return
          }

          node = this.$refs.modal.$el.getElementsByTagName('BUTTON')
          if (node.length) {
            node[node.length - 1].focus()
          }
        },
        hide: () => {
          this.$emit('hide')
        },
        dismiss: () => {
          this.$emit('cancel')
        },
        'escape-key': () => {
          this.hide().then(() => {
            this.$emit('escape-key')
            this.$emit('cancel')
          })
        }
      }
    }, child)
  },
  computed: {
    hasForm () {
      return this.prompt || this.options
    },
    okLabel () {
      return this.ok === true
        ? this.$q.i18n.label.ok
        : this.ok
    },
    cancelLabel () {
      return this.cancel === true
        ? this.$q.i18n.label.cancel
        : this.cancel
    },
    buttonClass () {
      return this.stackButtons
        ? 'column'
        : 'row'
    },
    okProps () {
      return Object(this.ok) === this.ok
        ? extend({
          color: this.color,
          label: this.$q.i18n.label.ok,
          noRipple: true
        }, this.ok)
        : { color: this.color, flat: true, label: this.okLabel, noRipple: true }
    },
    cancelProps () {
      return Object(this.cancel) === this.cancel
        ? extend({
          color: this.color,
          label: this.$q.i18n.label.cancel,
          noRipple: true
        }, this.cancel)
        : { color: this.color, flat: true, label: this.cancelLabel, noRipple: true }
    }
  },
  methods: {
    show () {
      return this.$refs.modal.show()
    },
    hide () {
      let data

      return this.$refs.modal.hide().then(() => {
        if (this.hasForm) {
          data = clone(this.__getData())
        }
        return data
      })
    },
    __getPrompt (h) {
      return [
        h(QInput, {
          style: 'margin-bottom: 10px',
          props: {
            value: this.prompt.model,
            type: this.prompt.type || 'text',
            color: this.color,
            noPassToggle: true
          },
          on: {
            input: v => { this.prompt.model = v },
            keyup: evt => {
              // if ENTER key
              if (getEventKey(evt) === 13) {
                this.__onOk()
              }
            }
          }
        })
      ]
    },
    __getOptions (h) {
      return [
        h(QOptionGroup, {
          props: {
            value: this.options.model,
            type: this.options.type,
            color: this.color,
            inline: this.options.inline,
            options: this.options.items
          },
          on: {
            change: v => { this.options.model = v }
          }
        })
      ]
    },
    __getButtons (h) {
      const child = []

      if (this.cancel) {
        child.push(h(QBtn, {
          props: this.cancelProps,
          on: { click: this.__onCancel }
        }))
      }
      if (this.ok) {
        child.push(h(QBtn, {
          props: this.okProps,
          on: { click: this.__onOk }
        }))
      }

      return h('div', {
        staticClass: 'modal-buttons',
        'class': this.buttonClass
      }, child)
    },
    __onOk () {
      return this.hide().then(data => {
        this.$emit('ok', data)
      })
    },
    __onCancel () {
      return this.hide().then(() => {
        this.$emit('cancel')
      })
    },
    __getData () {
      if (this.prompt) {
        return this.prompt.model
      }
      if (this.options) {
        return this.options.model
      }
    }
  }
}
