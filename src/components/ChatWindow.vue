<template>
  <div>
    <beautiful-chat
      :participants="participants"
      :title-image-url="titleImageUrl"
      :on-message-was-sent="onMessageWasSent"
      :message-list="messageList"
      :new-messages-count="newMessagesCount"
      :is-open="isChatOpen"
      :close="closeChat"
      :icons="icons"
      :open="openChat"
      :show-emoji="true"
      :show-file="true"
      :show-typing-indicator="showTypingIndicator"
      :show-launcher="true"
      :show-close-button="true"
      :colors="colors"
      :always-scroll-to-bottom="alwaysScrollToBottom"
      :message-styling="messageStyling"
      @onType="handleOnType"
      @edit="editMessage"
    ></beautiful-chat>
  </div>
</template>
<script>
import CloseIcon from 'vue-beautiful-chat/src/assets/close-icon.png'
import OpenIcon from 'vue-beautiful-chat/src/assets/logo-no-bg.svg'
import FileIcon from 'vue-beautiful-chat/src/assets/file.svg'
import CloseIconSvg from 'vue-beautiful-chat/src/assets/close.svg'
import styles from '../styles/element-variables.scss'

export default {
  name: 'ChatWindow',
  data() {
    return {
      icons: {
        open: {
          img: OpenIcon,
          name: 'default'
        },
        close: {
          img: CloseIcon,
          name: 'default'
        },
        file: {
          img: FileIcon,
          name: 'default'
        },
        closeSvg: {
          img: CloseIconSvg,
          name: 'default'
        }
      },
      participants: [
        {
          id: 'user1',
          name: 'Matteo',
          imageUrl: 'https://avatars3.githubusercontent.com/u/1915989?s=230&v=4'
        },
        {
          id: 'user2',
          name: 'Support',
          imageUrl: 'https://avatars3.githubusercontent.com/u/37018832?s=200&v=4'
        }
      ], // the list of all the participant of the conversation. `name` is the user name, `id` is used to establish the author of a message, `imageUrl` is supposed to be the user avatar.
      titleImageUrl: 'https://a.slack-edge.com/66f9/img/avatars-teams/ava_0001-34.png',
      messageList: [
        { type: 'text', author: `me`, data: { text: `Say yes!` }},
        { type: 'text', author: `user1`, data: { text: `No.` }}
      ], // the list of the messages to show, can be paginated and adjusted dynamically
      newMessagesCount: 0,
      isChatOpen: false, // to determine whether the chat window should be open or closed
      showTypingIndicator: '', // when set to a value matching the participant.id it shows the typing indicator for the specific user
      colors: {
        header: {
          bg: styles.info,
          text: '#ffffff'
        },
        launcher: {
          bg: styles.info
        },
        messageList: {
          bg: '#ffffff'
        },
        sentMessage: {
          bg: styles.info,
          text: '#ffffff'
        },
        receivedMessage: {
          bg: '#eaeaea',
          text: '#222222'
        },
        userInput: {
          bg: '#f4f7f9',
          text: '#565867'
        }
      }, // specifies the color scheme for the component
      alwaysScrollToBottom: false, // when set to true always scrolls the chat to the bottom when new events are in (new message, user starts typing...)
      messageStyling: true // enables *bold* /emph/ _underline_ and such (more info at github.com/mattezza/msgdown)
    }
  },
  methods: {
    sendMessage(text) {
      if (text.length > 0) {
        this.newMessagesCount = this.isChatOpen ? this.newMessagesCount : this.newMessagesCount + 1
        this.onMessageWasSent({ author: 'support', type: 'text', data: { text }})
      }
    },
    onMessageWasSent(message) {
      // called when the user sends a message
      this.messageList = [...this.messageList, message]
    },
    openChat() {
      // called when the user clicks on the fab button to open the chat
      this.isChatOpen = true
      this.newMessagesCount = 0
    },
    closeChat() {
      // called when the user clicks on the botton to close the chat
      this.isChatOpen = false
    },
    handleScrollToTop() {
      // called when the user scrolls message list to top
      // leverage pagination for loading another page of messages
    },
    handleOnType() {
      console.log('Emit typing event')
    },
    editMessage(message) {
      const m = this.messageList.find(m => m.id === message.id)
      m.isEdited = true
      m.data.text = message.data.text
    }
  }
}
</script>
<style>
  .sc-launcher {
    width: 40px !important;
    height: 40px !important;
    right: 15px !important;
    bottom: 15px !important;
  }

  .sc-launcher:before {
    width: 40px !important;
    height: 40px !important;
  }

  .sc-launcher .sc-open-icon,
  .sc-launcher .sc-closed-icon {
    width: 40px !important;
    height: 40px !important;
    right: 15px !important;
    bottom: 15px !important;
  }

  .sc-launcher .sc-closed-icon {
    width: 40px !important;
    height: 40px !important;
  }

  .sc-launcher .sc-open-icon {
    padding: 10px !important;
  }

  .sc-chat-window {
    height: 80% !important;
    max-height: 50% !important;
    width: 350px !important;
    position: fixed;
    right: 15px !important;
    bottom: 65px !important;
    box-sizing: border-box;
    box-shadow: 0 7px 40px 2px rgba(148, 149, 150, 0.1);
    background: white;
    border-radius: 5px !important;
  }
  .sc-chat-window.closed {
    opacity: 0;
    display: none;
    bottom: 90px;
  }

  .sc-message--me {
    text-align: right;
  }
  .sc-message--them {
    text-align: left;
  }

  @media (max-width: 450px) {
    .sc-chat-window {
      width: 100%;
      height: 100%;
      max-height: 100%;
      right: 0;
      bottom: 0;
      border-radius: 0;
    }
    .sc-chat-window {
      transition: 0.1s ease-in-out;
    }
    .sc-chat-window.closed {
      bottom: 0;
    }
  }

</style>
